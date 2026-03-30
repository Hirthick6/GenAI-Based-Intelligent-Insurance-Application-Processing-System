"""
Docling Structuring Service
============================
Takes combined OCR text and structures it into a document model.
Identifies sections across PDFs, handles cross-document fields,
and produces a structured output for JSON generation.
"""

import logging
import time
import re
from typing import Dict, List, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class DoclingService:
    """Structures OCR text using Docling for document understanding."""

    # Known section headers in insurance documents
    SECTION_PATTERNS = {
        "personal_information": [
            r"personal\s+(?:information|details|data)",
            r"applicant\s+(?:information|details)",
            r"insured\s+(?:person|individual)",
            r"name\s*:.*",
        ],
        "contact_information": [
            r"contact\s+(?:information|details)",
            r"address\s*:",
            r"phone\s*:",
            r"email\s*:",
        ],
        "employment_details": [
            r"employment\s+(?:information|details|history)",
            r"occupation\s*:",
            r"employer\s*:",
            r"income\s*:",
        ],
        "medical_history": [
            r"medical\s+(?:history|information|report|details)",
            r"health\s+(?:declaration|history)",
            r"diagnosis\s*:",
            r"treatment\s*:",
        ],
        "insurance_details": [
            r"(?:insurance|policy)\s+(?:details|information)",
            r"sum\s+(?:assured|insured)",
            r"premium\s*:",
            r"coverage\s*:",
            r"plan\s+(?:type|name)",
        ],
        "nominee_details": [
            r"nominee\s+(?:details|information)",
            r"beneficiary\s*:",
        ],
        "declaration": [
            r"declaration",
            r"i\s+(?:hereby\s+)?declare",
            r"signature\s*:",
        ],
        "identity_verification": [
            r"id\s+(?:proof|verification|document)",
            r"(?:aadhaar|pan|passport|voter\s+id|driving\s+license)",
        ],
    }

    # Document type detection patterns
    DOCUMENT_TYPE_PATTERNS = {
        "application_form": [
            r"application\s+form",
            r"proposal\s+form",
            r"insurance\s+application",
        ],
        "medical_report": [
            r"medical\s+(?:report|examination|certificate)",
            r"health\s+check",
            r"lab\s+report",
        ],
        "id_proof": [
            r"identity\s+(?:proof|card|document)",
            r"aadhaar",
            r"pan\s+card",
            r"passport",
        ],
        "income_proof": [
            r"income\s+(?:proof|certificate|tax)",
            r"salary\s+slip",
            r"itr",
            r"form\s+16",
        ],
        "address_proof": [
            r"address\s+proof",
            r"utility\s+bill",
            r"bank\s+statement",
        ],
    }

    def structure_documents(self, ocr_result: Dict) -> Dict:
        """
        Step 7: Apply Docling structuring to OCR output.

        Takes combined OCR text and produces a structured document model.
        Identifies sections across PDFs, handles cross-document fields.
        """
        start_time = time.time()

        structured = {
            "application_id": ocr_result["application_id"],
            "documents": [],
            "cross_document_fields": {},
            "document_model": {},
            "processing_time_ms": 0,
        }

        # Try to use Docling library first
        docling_result = self._try_docling_processing(ocr_result)

        if docling_result:
            structured["document_model"] = docling_result
        else:
            # Fallback to rule-based structuring
            logger.info("Using rule-based structuring (Docling not available)")

        # Process each document
        for doc in ocr_result.get("documents", []):
            doc_structured = self._structure_single_document(doc)
            structured["documents"].append(doc_structured)

        # Identify cross-document fields
        structured["cross_document_fields"] = self._identify_cross_document_fields(
            structured["documents"]
        )

        structured["processing_time_ms"] = int((time.time() - start_time) * 1000)

        logger.info(
            f"Docling structuring complete: {len(structured['documents'])} documents"
        )

        return structured

    def _try_docling_processing(self, ocr_result: Dict) -> Optional[Dict]:
        """Try to use Docling library for advanced document structuring."""
        try:
            from docling.document_converter import DocumentConverter

            converter = DocumentConverter()
            results = {}

            for doc in ocr_result.get("documents", []):
                # Process each document's source file if available
                file_path = doc.get("file_path")
                if file_path:
                    try:
                        doc_result = converter.convert(file_path)
                        results[doc["filename"]] = {
                            "text": doc_result.document.export_to_text() if hasattr(doc_result, 'document') else "",
                            "tables": [],
                            "sections": [],
                        }
                    except Exception as e:
                        logger.warning(f"Docling failed for {doc['filename']}: {e}")

            return results if results else None

        except ImportError:
            logger.info("Docling library not installed, using fallback structuring")
            return None
        except Exception as e:
            logger.warning(f"Docling processing failed: {e}")
            return None

    def _structure_single_document(self, doc: Dict) -> Dict:
        """Structure a single document by identifying sections and fields."""
        doc_structured = {
            "filename": doc["filename"],
            "document_type": self._detect_document_type(doc.get("document_text", "")),
            "sections": [],
            "key_value_pairs": {},
            "tables": [],
            "total_pages": doc.get("pages_processed", 0),
        }

        text = doc.get("document_text", "")
        if not text:
            return doc_structured

        # Identify sections
        doc_structured["sections"] = self._identify_sections(text)

        # Extract key-value pairs
        doc_structured["key_value_pairs"] = self._extract_key_value_pairs(text)

        # Detect tables (simple heuristic)
        doc_structured["tables"] = self._detect_tables(text)

        return doc_structured

    def _detect_document_type(self, text: str) -> str:
        """Detect document type based on content patterns."""
        text_lower = text.lower()

        for doc_type, patterns in self.DOCUMENT_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return doc_type

        return "other"

    def _identify_sections(self, text: str) -> List[Dict]:
        """Identify document sections based on header patterns."""
        sections = []
        lines = text.split("\n")
        current_section = None
        current_content = []

        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue

            # Check if this line is a section header
            section_type = self._match_section(line_stripped)

            if section_type:
                # Save previous section
                if current_section:
                    sections.append({
                        "type": current_section,
                        "header": current_content[0] if current_content else "",
                        "content": "\n".join(current_content),
                        "line_count": len(current_content),
                    })

                current_section = section_type
                current_content = [line_stripped]
            elif current_section:
                current_content.append(line_stripped)

        # Save last section
        if current_section:
            sections.append({
                "type": current_section,
                "header": current_content[0] if current_content else "",
                "content": "\n".join(current_content),
                "line_count": len(current_content),
            })

        return sections

    def _match_section(self, line: str) -> Optional[str]:
        """Match a line against known section patterns."""
        line_lower = line.lower()

        for section_type, patterns in self.SECTION_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, line_lower):
                    return section_type

        return None

    def _extract_key_value_pairs(self, text: str) -> Dict[str, str]:
        """Extract key-value pairs from text (e.g., 'Name: John Doe')."""
        pairs = {}
        patterns = [
            r"^([A-Za-z\s]+?)\s*:\s*(.+)$",
            r"^([A-Za-z\s]+?)\s*-\s*(.+)$",
        ]

        for line in text.split("\n"):
            line = line.strip()
            for pattern in patterns:
                match = re.match(pattern, line)
                if match:
                    key = match.group(1).strip().lower().replace(" ", "_")
                    value = match.group(2).strip()
                    if len(key) > 2 and len(value) > 0:
                        pairs[key] = value

        return pairs

    def _detect_tables(self, text: str) -> List[Dict]:
        """Detect tabular data in text using simple heuristics."""
        tables = []
        lines = text.split("\n")

        # Look for lines with multiple pipe or tab separators
        table_lines = []
        for i, line in enumerate(lines):
            if "|" in line or "\t" in line:
                table_lines.append({"line_number": i, "content": line.strip()})
            elif table_lines and len(table_lines) > 1:
                tables.append({
                    "start_line": table_lines[0]["line_number"],
                    "end_line": table_lines[-1]["line_number"],
                    "rows": len(table_lines),
                    "content": [tl["content"] for tl in table_lines],
                })
                table_lines = []

        return tables

    def _identify_cross_document_fields(self, documents: List[Dict]) -> Dict:
        """Identify fields that appear across multiple documents."""
        all_fields = {}

        for doc in documents:
            for key, value in doc.get("key_value_pairs", {}).items():
                if key not in all_fields:
                    all_fields[key] = []
                all_fields[key].append({
                    "value": value,
                    "source": doc["filename"],
                    "document_type": doc["document_type"],
                })

        # Find cross-document fields (appear in 2+ documents)
        cross_fields = {
            k: v for k, v in all_fields.items() if len(v) > 1
        }

        return cross_fields
