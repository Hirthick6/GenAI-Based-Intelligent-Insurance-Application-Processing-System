"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ─── Page Schemas ────────────────────────────────────────────

class PageResponse(BaseModel):
    id: str
    page_number: int
    image_path: Optional[str] = None
    ocr_text: str = ""
    ocr_confidence: float = 0.0
    preprocessing_applied: List[str] = []
    word_count: int = 0

    class Config:
        from_attributes = True


# ─── Document Schemas ────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    document_type: str
    filename: str
    file_path: Optional[str] = None
    file_size: int = 0
    total_pages: int = 0
    ocr_text: str = ""
    structured_data: Dict[str, Any] = {}
    confidence_score: float = 0.0
    processing_status: str = "pending"
    processing_time_ms: int = 0
    pages: List[PageResponse] = []

    class Config:
        from_attributes = True


# ─── Application Schemas ─────────────────────────────────────

class ApplicationCreate(BaseModel):
    email_subject: Optional[str] = None
    email_sender: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    application_id: str
    email_subject: Optional[str] = None
    email_sender: Optional[str] = None
    email_received_at: Optional[datetime] = None
    status: str
    total_documents: int = 0
    total_pages: int = 0
    extracted_data: Dict[str, Any] = {}
    validation_summary: Dict[str, Any] = {}
    confidence_score: float = 0.0
    extraction_percentage: float = 0.0
    error_message: Optional[str] = None
    documents: List[DocumentResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    id: str
    application_id: str
    email_subject: Optional[str] = None
    email_sender: Optional[str] = None
    status: str
    total_documents: int = 0
    total_pages: int = 0
    confidence_score: float = 0.0
    extraction_percentage: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Pipeline Schemas ────────────────────────────────────────

class PipelineStatusResponse(BaseModel):
    application_id: str
    status: str
    current_step: str
    progress_percent: float = 0.0
    documents_processed: int = 0
    total_documents: int = 0
    message: str = ""


# ─── Validation Schemas ──────────────────────────────────────

class ValidationResponse(BaseModel):
    application_id: str
    is_valid: bool
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0
    warnings: int = 0
    results: List[Dict[str, Any]] = []


# ─── Auth Schemas ─────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""
    role: str = "employee"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


# ─── Upload Schema ───────────────────────────────────────────

class UploadResponse(BaseModel):
    application_id: str
    message: str
    documents_count: int
    status: str
