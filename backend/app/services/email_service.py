"""
Email Processing Service
========================
Connects to IMAP server, detects emails with PDF attachments,
downloads them, and groups them under a single Application ID.
"""

import os
import email
import imaplib
import uuid
import logging
from datetime import datetime
from email.header import decode_header
from typing import List, Dict, Optional, Tuple

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Handles email fetching and PDF attachment extraction."""

    def __init__(self):
        self.imap_server = settings.IMAP_SERVER
        self.imap_port = settings.IMAP_PORT
        self.email_address = settings.IMAP_EMAIL
        self.password = settings.IMAP_PASSWORD
        self.folder = settings.IMAP_FOLDER
        self.upload_dir = settings.UPLOAD_DIR
        self.connection: Optional[imaplib.IMAP4_SSL] = None

    def connect(self) -> bool:
        """Establish connection to IMAP server."""
        try:
            self.connection = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            self.connection.login(self.email_address, self.password)
            self.connection.select(self.folder)
            logger.info(f"Connected to {self.imap_server} as {self.email_address}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to IMAP server: {e}")
            return False

    def disconnect(self):
        """Close IMAP connection."""
        if self.connection:
            try:
                self.connection.logout()
            except Exception:
                pass

    def _decode_header_value(self, value: str) -> str:
        """Decode email header value."""
        decoded_parts = decode_header(value)
        result = ""
        for part, charset in decoded_parts:
            if isinstance(part, bytes):
                result += part.decode(charset or "utf-8", errors="replace")
            else:
                result += part
        return result

    def _generate_application_id(self) -> str:
        """Generate a unique application ID."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        short_uuid = str(uuid.uuid4())[:8].upper()
        return f"APP-{timestamp}-{short_uuid}"

    def fetch_unprocessed_emails(self, max_emails: int = 20) -> List[Dict]:
        """
        Fetch emails with PDF attachments.
        Checks both UNSEEN and recent SEEN emails so read emails are not missed.
        """
        if not self.connection:
            if not self.connect():
                return []

        emails_with_pdfs = []
        seen_ids = set()

        try:
            # First try UNSEEN (unread) emails
            status, messages = self.connection.search(None, "UNSEEN")
            if status == "OK" and messages[0]:
                email_ids = messages[0].split()
                for email_id in email_ids[:max_emails]:
                    seen_ids.add(email_id)
                    email_data = self._process_single_email(email_id)
                    if email_data and email_data["attachments"]:
                        emails_with_pdfs.append(email_data)

            # Also check ALL (including read) emails - in case user opened email before processing
            status, messages = self.connection.search(None, "ALL")
            if status == "OK" and messages[0]:
                all_ids = messages[0].split()
                for email_id in reversed(all_ids):  # Most recent first
                    if len(emails_with_pdfs) >= max_emails:
                        break
                    if email_id in seen_ids:
                        continue
                    seen_ids.add(email_id)
                    email_data = self._process_single_email(email_id)
                    if email_data and email_data["attachments"]:
                        emails_with_pdfs.append(email_data)

        except Exception as e:
            logger.error(f"Error fetching emails: {e}")

        return emails_with_pdfs

    def _process_single_email(self, email_id: bytes) -> Optional[Dict]:
        """Process a single email and extract PDF attachments."""
        try:
            status, msg_data = self.connection.fetch(email_id, "(RFC822)")
            if status != "OK":
                return None

            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            # Extract email metadata
            subject = self._decode_header_value(msg.get("Subject", "No Subject"))
            sender = self._decode_header_value(msg.get("From", "Unknown"))
            date_str = msg.get("Date", "")

            # Generate unique application ID for this email
            application_id = self._generate_application_id()

            # Create application directory
            app_dir = os.path.join(self.upload_dir, application_id)
            os.makedirs(app_dir, exist_ok=True)

            # Extract PDF attachments
            attachments = self._extract_pdf_attachments(msg, app_dir)

            if not attachments:
                logger.info(f"No PDF attachments in email: {subject}")
                return None

            return {
                "application_id": application_id,
                "email_uid": email_id.decode() if isinstance(email_id, bytes) else str(email_id),
                "subject": subject,
                "sender": sender,
                "date": date_str,
                "attachment_count": len(attachments),
                "attachments": attachments,
                "app_dir": app_dir,
            }

        except Exception as e:
            logger.error(f"Error processing email {email_id}: {e}")
            return None

    def _extract_pdf_attachments(self, msg: email.message.Message, app_dir: str) -> List[Dict]:
        """Extract all PDF attachments from an email message."""
        attachments = []

        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))

            # Check if this part is a PDF attachment
            if "attachment" in content_disposition or content_type == "application/pdf":
                filename = part.get_filename()
                if not filename:
                    continue

                filename = self._decode_header_value(filename)

                # Only process PDF files
                if not filename.lower().endswith(".pdf"):
                    continue

                # Save the PDF
                file_data = part.get_payload(decode=True)
                if not file_data:
                    continue

                # Sanitize filename
                safe_filename = self._sanitize_filename(filename)
                file_path = os.path.join(app_dir, safe_filename)

                with open(file_path, "wb") as f:
                    f.write(file_data)

                attachments.append({
                    "filename": safe_filename,
                    "original_filename": filename,
                    "file_path": file_path,
                    "file_size": len(file_data),
                })

                logger.info(f"Saved attachment: {safe_filename} ({len(file_data)} bytes)")

        return attachments

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal."""
        # Remove directory separators and dangerous characters
        filename = os.path.basename(filename)
        filename = filename.replace("..", "").replace("/", "").replace("\\", "")
        return filename

    def process_uploaded_files(
        self, files: List[Tuple[str, bytes]], subject: str = "", sender: str = ""
    ) -> Dict:
        """
        Process manually uploaded PDF files (non-email path).
        Groups files under a single application ID.
        """
        application_id = self._generate_application_id()
        app_dir = os.path.join(self.upload_dir, application_id)
        os.makedirs(app_dir, exist_ok=True)

        attachments = []
        for filename, file_data in files:
            if not filename.lower().endswith(".pdf"):
                continue

            safe_filename = self._sanitize_filename(filename)
            file_path = os.path.join(app_dir, safe_filename)

            with open(file_path, "wb") as f:
                f.write(file_data)

            attachments.append({
                "filename": safe_filename,
                "original_filename": filename,
                "file_path": file_path,
                "file_size": len(file_data),
            })

        return {
            "application_id": application_id,
            "subject": subject or "Manual Upload",
            "sender": sender or "Direct Upload",
            "date": datetime.utcnow().isoformat(),
            "attachment_count": len(attachments),
            "attachments": attachments,
            "app_dir": app_dir,
        }
