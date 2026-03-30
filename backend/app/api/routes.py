"""
FastAPI API Routes
==================
REST endpoints for the insurance document processing pipeline.
Handles file uploads, pipeline triggering, and data retrieval.
RBAC: Admin = full access (upload, delete, process-emails), Employee = upload + view (no delete).
"""

import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.auth import get_current_user, require_admin
from app.utils.helpers import fs_path_to_url
from app.models.models import (
    Application, Document, Page, ExtractedField,
    ValidationResult, ApplicationStatus, User,
)
from app.schemas.schemas import (
    ApplicationResponse, ApplicationListResponse,
    DocumentResponse, PageResponse,
    PipelineStatusResponse, ValidationResponse, UploadResponse,
)
from app.services.pipeline import PipelineOrchestrator
from app.services.chat_service import ChatService

logger = logging.getLogger(__name__)

router = APIRouter()
pipeline = PipelineOrchestrator()
chat_service = ChatService()


# ─── Upload & Process ─────────────────────────────────────

@router.post("/upload", response_model=UploadResponse, tags=["Pipeline"])
async def upload_and_process(
    files: List[UploadFile] = File(...),
    subject: str = Query(default="Manual Upload", description="Application subject"),
    sender: str = Query(default="Direct Upload", description="Sender info"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Upload multiple PDF files and process them through the full pipeline.

    - Accepts multiple PDF files in a single request
    - Groups them under one Application ID
    - Runs the complete processing pipeline
    """
    # Validate files
    pdf_files = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files are accepted. Got: {file.filename}",
            )
        content = await file.read()
        pdf_files.append((file.filename, content))

    if not pdf_files:
        raise HTTPException(status_code=400, detail="No PDF files provided")

    try:
        result = pipeline.process_uploaded_files(db, pdf_files, subject, sender)

        return UploadResponse(
            application_id=result["application_id"],
            message=f"Successfully processed {result['total_documents']} documents",
            documents_count=result["total_documents"],
            status=result["status"],
        )

    except Exception as e:
        logger.error(f"Upload processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/email-inbox", tags=["Pipeline"])
async def get_email_inbox(_: User = Depends(get_current_user)):
    """
    Get the dedicated insurance applications inbox email address.
    Customers send PDF documents to this email.
    """
    configured = bool(settings.IMAP_EMAIL and settings.IMAP_PASSWORD)
    return {
        "inbox_email": settings.IMAP_EMAIL if configured else None,
        "configured": configured,
        "message": "Send insurance application PDFs to this email" if configured else "Configure IMAP_EMAIL and IMAP_PASSWORD in backend .env to enable email inbox",
    }


@router.post("/process-emails", tags=["Pipeline"])
async def process_emails(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Poll email inbox and process any unread emails with PDF attachments.
    """
    try:
        results = pipeline.process_from_email(db)
        return {
            "message": f"Processed {len(results)} emails",
            "results": results,
        }
    except Exception as e:
        logger.error(f"Email processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Email processing failed: {str(e)}")


# ─── Applications ──────────────────────────────────────────

@router.get("/applications", response_model=List[ApplicationListResponse], tags=["Applications"])
async def list_applications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all applications with pagination and optional status filter."""
    query = db.query(Application).options(joinedload(Application.documents))

    if status:
        try:
            status_enum = ApplicationStatus(status)
            query = query.filter(Application.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    applications = (
        query.order_by(Application.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    def _app_confidence(app):
        if app.documents:
            return sum(d.confidence_score for d in app.documents) / len(app.documents)
        return app.confidence_score or 0.0

    return [
        ApplicationListResponse(
            id=str(app.id),
            application_id=app.application_id,
            email_subject=app.email_subject,
            email_sender=app.email_sender,
            status=app.status.value if app.status else "unknown",
            total_documents=app.total_documents,
            total_pages=app.total_pages,
            confidence_score=_app_confidence(app),
            extraction_percentage=app.extraction_percentage or 0.0,
            created_at=app.created_at,
        )
        for app in applications
    ]


@router.get("/applications/{application_id}", response_model=ApplicationResponse, tags=["Applications"])
async def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Get detailed application data including all documents, pages, and extracted fields.
    """
    application = (
        db.query(Application)
        .options(
            joinedload(Application.documents).joinedload(Document.pages)
        )
        .filter(Application.application_id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    def _to_url(path):
        return fs_path_to_url(path, settings.UPLOAD_DIR, settings.PROCESSED_DIR) if path else None

    # Use average document OCR confidence for consistency (same as document/page display)
    docs = application.documents
    confidence_score = (
        sum(d.confidence_score for d in docs) / len(docs) if docs else (application.confidence_score or 0.0)
    )

    return ApplicationResponse(
        id=str(application.id),
        application_id=application.application_id,
        email_subject=application.email_subject,
        email_sender=application.email_sender,
        email_received_at=application.email_received_at,
        status=application.status.value if application.status else "unknown",
        total_documents=application.total_documents,
        total_pages=application.total_pages,
        extracted_data=application.extracted_data or {},
        validation_summary=application.validation_summary or {},
        confidence_score=confidence_score,
        extraction_percentage=application.extraction_percentage or 0.0,
        error_message=application.error_message,
        documents=[
            DocumentResponse(
                id=str(doc.id),
                document_type=doc.document_type.value if doc.document_type else "other",
                filename=doc.filename,
                file_path=_to_url(doc.file_path),
                file_size=doc.file_size,
                total_pages=doc.total_pages,
                ocr_text=doc.ocr_text or "",
                structured_data=doc.structured_data or {},
                confidence_score=doc.confidence_score,
                processing_status=doc.processing_status,
                processing_time_ms=doc.processing_time_ms,
                pages=[
                    PageResponse(
                        id=str(page.id),
                        page_number=page.page_number,
                        image_path=_to_url(page.image_path),
                        ocr_text=page.ocr_text or "",
                        ocr_confidence=page.ocr_confidence,
                        preprocessing_applied=page.preprocessing_applied or [],
                        word_count=page.word_count,
                    )
                    for page in sorted(doc.pages, key=lambda p: p.page_number)
                ],
            )
            for doc in application.documents
        ],
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.delete("/applications/{application_id}", tags=["Applications"])
async def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Delete an application and all associated data (cascades to documents, pages, extracted_fields, validation_results, email_log)."""
    try:
        application = (
            db.query(Application)
            .filter(Application.application_id == application_id)
            .first()
        )

        if not application:
            raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

        db.delete(application)
        db.commit()

        return {"message": f"Application {application_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Delete application failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Documents ──────────────────────────────────────────────

@router.get("/applications/{application_id}/documents", tags=["Documents"])
async def get_application_documents(
    application_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get all documents for a specific application."""
    application = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    documents = (
        db.query(Document)
        .filter(Document.application_id == application.id)
        .all()
    )

    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "document_type": doc.document_type.value if doc.document_type else "other",
            "total_pages": doc.total_pages,
            "confidence_score": doc.confidence_score,
            "processing_status": doc.processing_status,
        }
        for doc in documents
    ]


# ─── Pages ──────────────────────────────────────────────────

@router.get("/documents/{document_id}/pages", tags=["Pages"])
async def get_document_pages(
    document_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get all pages for a specific document with OCR text."""
    pages = (
        db.query(Page)
        .filter(Page.document_id == document_id)
        .order_by(Page.page_number)
        .all()
    )

    def _to_url(path):
        return fs_path_to_url(path, settings.UPLOAD_DIR, settings.PROCESSED_DIR) if path else None

    return [
        PageResponse(
            id=str(page.id),
            page_number=page.page_number,
            image_path=_to_url(page.image_path),
            ocr_text=page.ocr_text or "",
            ocr_confidence=page.ocr_confidence,
            preprocessing_applied=page.preprocessing_applied or [],
            word_count=page.word_count,
        )
        for page in pages
    ]


@router.get("/documents/{document_id}/pdf", tags=["Documents"])
async def get_document_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get the original PDF file URL for a document."""
    from fastapi.responses import FileResponse
    
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    
    return FileResponse(
        document.file_path,
        media_type="application/pdf",
        filename=document.filename,
    )


@router.get("/files/serve", tags=["Files"])
async def serve_file(
    path: str = Query(..., description="File path to serve"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Serve static files (images, PDFs) with authentication.
    This endpoint replaces direct static file access for authenticated resources.
    """
    from fastapi.responses import FileResponse
    import mimetypes
    
    # Security: Prevent path traversal attacks
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    # Construct full file path
    if path.startswith("processed/"):
        full_path = os.path.join(settings.PROCESSED_DIR, path.replace("processed/", ""))
    elif path.startswith("uploads/"):
        full_path = os.path.join(settings.UPLOAD_DIR, path.replace("uploads/", ""))
    else:
        # Try both directories
        processed_path = os.path.join(settings.PROCESSED_DIR, path)
        upload_path = os.path.join(settings.UPLOAD_DIR, path)
        
        if os.path.exists(processed_path):
            full_path = processed_path
        elif os.path.exists(upload_path):
            full_path = upload_path
        else:
            raise HTTPException(status_code=404, detail="File not found")
    
    # Verify file exists
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(full_path)
    if not mime_type:
        mime_type = "application/octet-stream"
    
    return FileResponse(
        full_path,
        media_type=mime_type,
        filename=os.path.basename(full_path),
    )


# ─── Validation ─────────────────────────────────────────────

@router.get("/applications/{application_id}/validation", response_model=ValidationResponse, tags=["Validation"])
async def get_validation_results(
    application_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get validation results for an application."""
    application = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    results = (
        db.query(ValidationResult)
        .filter(ValidationResult.application_id == application.id)
        .all()
    )

    passed = sum(1 for r in results if r.is_passed)
    failed = sum(1 for r in results if not r.is_passed and r.severity == "error")
    warnings = sum(1 for r in results if not r.is_passed and r.severity == "warning")

    return ValidationResponse(
        application_id=application_id,
        is_valid=failed == 0,
        total_checks=len(results),
        passed_checks=passed,
        failed_checks=failed,
        warnings=warnings,
        results=[
            {
                "rule": r.rule_name,
                "passed": r.is_passed,
                "severity": r.severity,
                "message": r.message,
                "details": r.details or {},
            }
            for r in results
        ],
    )


# ─── Extracted Fields ─────────────────────────────────────

@router.get("/applications/{application_id}/fields", tags=["Extracted Fields"])
async def get_extracted_fields(
    application_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get all extracted fields for an application."""
    application = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    fields = (
        db.query(ExtractedField)
        .filter(ExtractedField.application_id == application.id)
        .all()
    )

    return [
        {
            "field_name": f.field_name,
            "field_value": f.field_value,
            "field_category": f.field_category,
            "confidence": f.confidence,
            "is_validated": f.is_validated,
        }
        for f in fields
    ]


# ─── Update Extracted Data ──────────────────────────────────

@router.patch("/applications/{application_id}/extracted-data", tags=["Applications"])
async def update_extracted_data(
    application_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Update a single field inside extracted_data.
    Payload: { "category": "contact", "field": "email", "value": "new@email.com" }
    """
    from sqlalchemy.orm.attributes import flag_modified
    application = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    category = payload.get("category")
    field = payload.get("field")
    value = payload.get("value")

    if not category or not field:
        raise HTTPException(status_code=400, detail="category and field are required")

    data = dict(application.extracted_data or {})
    if category not in data or not isinstance(data[category], dict):
        data[category] = {}
    data[category][field] = value
    application.extracted_data = data
    flag_modified(application, "extracted_data")
    db.commit()
    return {"success": True, "category": category, "field": field, "value": value}


# ─── Chat ────────────────────────────────────────────────────

@router.post("/applications/{application_id}/chat", tags=["Chat"])
async def chat_with_document(
    application_id: str,
    question: str = Query(..., description="Question to ask about the document"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Ask questions about a document using AI.
    Uses Groq API (Llama 3.3 70B) to answer based on extracted data and OCR text.
    """
    application = (
        db.query(Application)
        .options(joinedload(Application.documents))
        .filter(Application.application_id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

    # Build application metadata context
    docs = application.documents
    avg_confidence = (
        sum(d.confidence_score for d in docs) / len(docs) if docs else (application.confidence_score or 0.0)
    )
    meta_lines = [
        "=== APPLICATION METADATA ===",
        f"Application ID: {application.application_id}",
        f"Email Subject: {application.email_subject or 'Manual Upload'}",
        f"Sender: {application.email_sender or 'Direct Upload'}",
        f"Status: {application.status.value if application.status else 'unknown'}",
        f"Total Documents: {application.total_documents}",
        f"Total Pages: {application.total_pages}",
        f"Confidence Score: {avg_confidence:.1f}%",
        f"Extraction Percentage: {application.extraction_percentage or 0.0:.2f}%",
        f"Created At: {application.created_at}",
    ]
    if docs:
        meta_lines.append("Documents:")
        for doc in docs:
            meta_lines.append(
                f"  - {doc.filename} | Type: {doc.document_type.value if doc.document_type else 'other'} "
                f"| Pages: {doc.total_pages} | Confidence: {doc.confidence_score:.1f}%"
            )
    metadata_text = "\n".join(meta_lines)

    # Gather OCR text from documents
    document_text = metadata_text
    for doc in docs:
        if doc.ocr_text:
            document_text += f"\n\n=== {doc.filename} ===\n{doc.ocr_text}"

    # Get extracted data
    extracted_data = application.extracted_data

    # Call chat service
    result = chat_service.ask_question(
        question=question,
        document_context=document_text,
        extracted_data=extracted_data,
    )

    return result


# ─── Stats ───────────────────────────────────────────────────

@router.get("/stats", tags=["Stats"])
async def get_pipeline_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get overall pipeline statistics."""
    total_apps = db.query(Application).count()
    completed = db.query(Application).filter(
        Application.status == ApplicationStatus.COMPLETED
    ).count()
    processing = db.query(Application).filter(
        Application.status == ApplicationStatus.PROCESSING
    ).count()
    failed = db.query(Application).filter(
        Application.status == ApplicationStatus.FAILED
    ).count()
    total_docs = db.query(Document).count()
    total_pages = db.query(Page).count()

    return {
        "total_applications": total_apps,
        "completed": completed,
        "processing": processing,
        "failed": failed,
        "total_documents": total_docs,
        "total_pages": total_pages,
    }
