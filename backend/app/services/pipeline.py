"""
Pipeline Orchestrator
=====================
Orchestrates the complete document processing pipeline:
Email → PDFs → Batch Processing → OCR → Docling → JSON → GenAI → Validation → DB
"""

import json
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import (
    Application, Document, Page, ExtractedField,
    ValidationResult, EmailLog,
    ApplicationStatus, DocumentType,
)
from app.services.email_service import EmailService
from app.services.pdf_service import PDFBatchProcessor
from app.services.ocr_service import OCRService
from app.services.docling_service import DoclingService
from app.services.genai_service import GenAIService
from app.services.validation_service import ValidationService

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Manages the end-to-end document processing pipeline."""

    def __init__(self):
        self.email_service = EmailService()
        self.pdf_processor = PDFBatchProcessor()
        self.ocr_service = OCRService()
        self.docling_service = DoclingService()
        self.genai_service = GenAIService()
        self.validation_service = ValidationService()

    # ─── Full Pipeline ──────────────────────────────────────

    def process_from_email(self, db: Session) -> List[Dict]:
        """
        Full pipeline triggered by email polling.
        Processes emails with PDF attachments (unread + read, skips already-processed).
        """
        results = []

        # Step 1-2: Fetch emails and extract attachments
        emails = self.email_service.fetch_unprocessed_emails()

        # Get already-processed email UIDs to avoid duplicates
        processed_uids = {str(e.email_uid) for e in db.query(EmailLog).filter(EmailLog.email_uid.isnot(None)).all()}

        for email_data in emails:
            email_uid = str(email_data.get("email_uid", ""))
            if email_uid in processed_uids:
                continue
            processed_uids.add(email_uid)
            try:
                result = self._run_pipeline(db, email_data)
                results.append(result)
            except Exception as e:
                logger.error(f"Pipeline failed for {email_data['application_id']}: {e}")
                results.append({
                    "application_id": email_data["application_id"],
                    "status": "failed",
                    "error": str(e),
                })

        return results

    def process_uploaded_files(
        self, db: Session, files: List[Tuple[str, bytes]],
        subject: str = "", sender: str = ""
    ) -> Dict:
        """
        Pipeline triggered by manual file upload.
        """
        # Group files under one application
        email_data = self.email_service.process_uploaded_files(files, subject, sender)
        return self._run_pipeline(db, email_data)

    def _run_pipeline(self, db: Session, email_data: Dict) -> Dict:
        """
        Execute the full processing pipeline for one application.

        Pipeline Steps:
            1. Email attachment extraction (already done)
            2. Attachment grouping & Application ID assignment
            3. Batch PDF processing (split pages, convert images)
            4. Page-level preprocessing
            5. PyTesseract OCR (page-wise)
            6. Document reconstruction
            7. Docling structuring
            8. JSON generation
            9. GenAI extraction
            10. Validation
            11. API / Database storage
        """
        pipeline_start = time.time()
        application_id = email_data["application_id"]

        logger.info(f"Pipeline started for {application_id}")

        # ── Create application record ──
        application = self._create_application(db, email_data)

        try:
            # ── Step 2: Log email ──
            self._log_email(db, email_data, application)
            self._update_status(db, application, ApplicationStatus.PROCESSING)

            # ── Step 3-4: Batch PDF Processing & Preprocessing ──
            logger.info(f"[{application_id}] Step 3-4: Batch PDF processing...")
            batch_result = self.pdf_processor.process_batch(
                application_id, email_data["attachments"]
            )

            # Save document records
            self._save_documents(db, application, batch_result)

            # ── Step 5-6: OCR (Page-wise) & Document Reconstruction ──
            logger.info(f"[{application_id}] Step 5-6: OCR processing...")
            ocr_result = self.ocr_service.process_application_ocr(batch_result)
            self._update_ocr_results(db, application, ocr_result)
            self._update_status(db, application, ApplicationStatus.OCR_COMPLETE)

            # ── Step 7: Docling Structuring ──
            logger.info(f"[{application_id}] Step 7: Docling structuring...")
            structured_result = self.docling_service.structure_documents(ocr_result)
            self._update_status(db, application, ApplicationStatus.STRUCTURED)

            # ── Step 8: JSON Generation ──
            logger.info(f"[{application_id}] Step 8: JSON generation...")
            application_json = self._generate_application_json(
                application_id, email_data, batch_result, structured_result
            )

            # ── Step 9: GenAI Extraction ──
            logger.info(f"[{application_id}] Step 9: GenAI extraction...")
            genai_result = self.genai_service.extract_fields(structured_result)
            self._update_status(db, application, ApplicationStatus.EXTRACTED)

            # ── Step 10: Validation ──
            logger.info(f"[{application_id}] Step 10: Validation...")
            validation_result = self.validation_service.validate_application(
                genai_result, structured_result
            )

            # ── Step 11-12: Save to Database ──
            logger.info(f"[{application_id}] Step 11-12: Saving to database...")
            self._save_extracted_fields(db, application, genai_result)
            self._save_validation_results(db, application, validation_result)

            # Update application with final data
            application.extracted_data = genai_result.get("extracted_fields", {})
            application.validation_summary = {
                "is_valid": validation_result["is_valid"],
                "completeness_score": validation_result["completeness_score"],
                "passed_checks": validation_result["passed_checks"],
                "total_checks": validation_result["total_checks"],
                "missing_documents": validation_result["missing_documents"],
                "missing_fields": validation_result["missing_fields"],
            }
            # Use average document OCR confidence (matches document/page confidence display)
            docs = db.query(Document).filter(Document.application_id == application.id).all()
            if docs:
                application.confidence_score = sum(d.confidence_score for d in docs) / len(docs)
            else:
                application.confidence_score = 0.0
            
            # Set extraction percentage from validation result
            application.extraction_percentage = validation_result.get("extraction_percentage", 0.0)
            
            application.status = ApplicationStatus.VALIDATED
            db.commit()
            db.refresh(application)

            # Mark as completed
            self._update_status(db, application, ApplicationStatus.COMPLETED)

            pipeline_time = int((time.time() - pipeline_start) * 1000)
            logger.info(f"Pipeline completed for {application_id} in {pipeline_time}ms")

            return {
                "application_id": application_id,
                "status": "completed",
                "total_documents": len(email_data["attachments"]),
                "total_pages": batch_result["total_pages"],
                "completeness_score": validation_result["completeness_score"],
                "is_valid": validation_result["is_valid"],
                "processing_time_ms": pipeline_time,
            }

        except Exception as e:
            logger.error(f"Pipeline failed for {application_id}: {e}")
            application.status = ApplicationStatus.FAILED
            application.error_message = str(e)
            db.commit()
            raise

    # ─── Database Operations ────────────────────────────────

    def _create_application(self, db: Session, email_data: Dict) -> Application:
        """Create application record in database."""
        application = Application(
            application_id=email_data["application_id"],
            email_subject=email_data.get("subject", ""),
            email_sender=email_data.get("sender", ""),
            email_received_at=datetime.utcnow(),
            status=ApplicationStatus.RECEIVED,
            total_documents=email_data.get("attachment_count", 0),
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    def _log_email(self, db: Session, email_data: Dict, application: Application):
        """Log email processing activity."""
        email_log = EmailLog(
            application_id=application.id,
            email_uid=email_data.get("email_uid", ""),
            email_subject=email_data.get("subject", ""),
            email_from=email_data.get("sender", ""),
            email_date=datetime.utcnow(),
            attachment_count=email_data.get("attachment_count", 0),
            attachment_names=[a["filename"] for a in email_data.get("attachments", [])],
            processing_status="processing",
        )
        db.add(email_log)
        db.commit()

    def _save_documents(self, db: Session, application: Application, batch_result: Dict):
        """Save document and page records from batch processing."""
        total_pages = 0

        for doc_data in batch_result.get("documents", []):
            document = Document(
                application_id=application.id,
                filename=doc_data["filename"],
                file_path=doc_data.get("file_path", ""),
                total_pages=doc_data.get("total_pages", 0),
                processing_status="processed",
            )
            db.add(document)
            db.flush()

            # Save page records
            for page_data in doc_data.get("pages", []):
                page = Page(
                    document_id=document.id,
                    page_number=page_data["page_number"],
                    image_path=page_data.get("preprocessed_image_path", ""),
                    preprocessing_applied=page_data.get("preprocessing_applied", []),
                )
                db.add(page)

            total_pages += doc_data.get("total_pages", 0)

        application.total_pages = total_pages
        db.commit()

    def _update_ocr_results(self, db: Session, application: Application, ocr_result: Dict):
        """Update documents and pages with OCR results."""
        for doc_ocr in ocr_result.get("documents", []):
            # Find matching document
            document = (
                db.query(Document)
                .filter(
                    Document.application_id == application.id,
                    Document.filename == doc_ocr["filename"],
                )
                .first()
            )

            if document:
                document.ocr_text = doc_ocr.get("document_text", "")
                document.confidence_score = doc_ocr.get("average_confidence", 0.0)

                # Update page OCR
                for page_ocr in doc_ocr.get("pages", []):
                    page = (
                        db.query(Page)
                        .filter(
                            Page.document_id == document.id,
                            Page.page_number == page_ocr["page_number"],
                        )
                        .first()
                    )
                    if page:
                        page.ocr_text = page_ocr.get("text", "")
                        page.ocr_confidence = page_ocr.get("confidence", 0.0)
                        page.word_count = page_ocr.get("word_count", 0)

        db.commit()

    def _save_extracted_fields(self, db: Session, application: Application, genai_result: Dict):
        """Save extracted fields to database."""
        extracted = genai_result.get("extracted_fields", {})
        
        # Helper function to convert string confidence to float
        def convert_confidence(conf_value) -> float:
            """Convert confidence value to float."""
            if isinstance(conf_value, (int, float)):
                return float(conf_value)
            if isinstance(conf_value, str):
                conf_str = conf_value.lower().strip()
                if conf_str == "high":
                    return 0.9
                elif conf_str == "medium":
                    return 0.6
                elif conf_str == "low":
                    return 0.3
            return 0.0

        def save_fields(data: Dict, category: str = ""):
            for key, value in data.items():
                # Skip field_confidence metadata - it's not an actual field
                if category == "field_confidence" or key == "field_confidence":
                    continue
                    
                if isinstance(value, dict):
                    save_fields(value, key)
                elif isinstance(value, list):
                    # Get confidence and convert if needed
                    conf_scores = genai_result.get("confidence_scores", {})
                    conf_value = conf_scores.get(key, 0.0)
                    confidence = convert_confidence(conf_value)
                    
                    field = ExtractedField(
                        application_id=application.id,
                        field_name=f"{category}.{key}" if category else key,
                        field_value=json.dumps(value),
                        field_category=category,
                        confidence=confidence,
                    )
                    db.add(field)
                else:
                    if value and str(value).strip():
                        # Get confidence and convert if needed
                        conf_scores = genai_result.get("confidence_scores", {})
                        conf_value = conf_scores.get(key, 0.0)
                        confidence = convert_confidence(conf_value)
                        
                        field = ExtractedField(
                            application_id=application.id,
                            field_name=f"{category}.{key}" if category else key,
                            field_value=str(value),
                            field_category=category,
                            confidence=confidence,
                        )
                        db.add(field)

        save_fields(extracted)
        db.commit()

    def _save_validation_results(self, db: Session, application: Application, validation: Dict):
        """Save validation results to database."""
        for result in validation.get("results", []):
            vr = ValidationResult(
                application_id=application.id,
                rule_name=result["rule"],
                is_passed=result["passed"],
                severity=result["severity"],
                message=result["message"],
                details=result.get("details", {}),
            )
            db.add(vr)

        db.commit()

    def _update_status(self, db: Session, application: Application, status: ApplicationStatus):
        """Update application status."""
        application.status = status
        application.updated_at = datetime.utcnow()
        db.commit()

    # ─── JSON Generation ──────────────────────────────────

    def _generate_application_json(
        self, application_id: str, email_data: Dict,
        batch_result: Dict, structured_result: Dict
    ) -> Dict:
        """
        Step 8: Generate unified JSON per application.
        """
        documents = []
        for doc in structured_result.get("documents", []):
            documents.append({
                "type": doc.get("document_type", "other"),
                "filename": doc.get("filename", ""),
                "pages": doc.get("total_pages", 0),
                "sections": [s["type"] for s in doc.get("sections", [])],
                "key_fields_count": len(doc.get("key_value_pairs", {})),
            })

        application_json = {
            "application_id": application_id,
            "email": {
                "subject": email_data.get("subject", ""),
                "sender": email_data.get("sender", ""),
                "received": email_data.get("date", ""),
            },
            "documents": documents,
            "total_documents": len(documents),
            "total_pages": batch_result.get("total_pages", 0),
            "cross_document_fields": structured_result.get("cross_document_fields", {}),
        }

        return application_json
