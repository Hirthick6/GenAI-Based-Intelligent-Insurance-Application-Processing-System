"""SQLAlchemy database models for the insurance document processing pipeline."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, DateTime,
    ForeignKey, Boolean, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class ApplicationStatus(str, enum.Enum):
    RECEIVED = "received"
    PROCESSING = "processing"
    OCR_COMPLETE = "ocr_complete"
    STRUCTURED = "structured"
    EXTRACTED = "extracted"
    VALIDATED = "validated"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"


class User(Base):
    """User accounts for authentication and RBAC."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="")
    role = Column(
        SQLEnum(UserRole),
        default=UserRole.EMPLOYEE,
        nullable=False,
    )
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.email}>"


class DocumentType(str, enum.Enum):
    APPLICATION_FORM = "application_form"
    MEDICAL_REPORT = "medical_report"
    ID_PROOF = "id_proof"
    INCOME_PROOF = "income_proof"
    ADDRESS_PROOF = "address_proof"
    PHOTOGRAPH = "photograph"
    OTHER = "other"


class Application(Base):
    """Represents a single insurance application from one email."""
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(String(50), unique=True, nullable=False, index=True)
    email_subject = Column(String(500))
    email_sender = Column(String(255))
    email_received_at = Column(DateTime)
    status = Column(
        SQLEnum(ApplicationStatus),
        default=ApplicationStatus.RECEIVED,
        nullable=False,
    )
    total_documents = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    extracted_data = Column(JSON, default=dict)
    validation_summary = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.0)
    extraction_percentage = Column(Float, default=0.0)  # Temporary field
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    email_log = relationship("EmailLog", back_populates="application", uselist=False, cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="application", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application {self.application_id}>"


class Document(Base):
    """Represents a single PDF document within an application."""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    document_type = Column(
        SQLEnum(DocumentType),
        default=DocumentType.OTHER,
        nullable=False,
    )
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000))
    file_size = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    ocr_text = Column(Text, default="")
    structured_data = Column(JSON, default=dict)
    confidence_score = Column(Float, default=0.0)
    processing_status = Column(String(50), default="pending")
    processing_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="documents")
    pages = relationship("Page", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document {self.filename}>"


class Page(Base):
    """Represents a single page within a PDF document."""
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    image_path = Column(String(1000))
    ocr_text = Column(Text, default="")
    ocr_confidence = Column(Float, default=0.0)
    preprocessing_applied = Column(JSON, default=list)
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="pages")

    def __repr__(self):
        return f"<Page {self.page_number} of Document {self.document_id}>"


class ExtractedField(Base):
    """Stores individual extracted fields from GenAI processing."""
    __tablename__ = "extracted_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    field_name = Column(String(255), nullable=False)
    field_value = Column(Text)
    field_category = Column(String(100))
    source_document = Column(String(500))
    source_page = Column(Integer)
    confidence = Column(Float, default=0.0)
    is_validated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="extracted_fields")


class ValidationResult(Base):
    """Stores validation results for each application."""
    __tablename__ = "validation_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    rule_name = Column(String(255), nullable=False)
    is_passed = Column(Boolean, default=False)
    severity = Column(String(50), default="warning")  # error, warning, info
    message = Column(Text)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="validation_results")


class EmailLog(Base):
    """Logs email processing activity."""
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=True)
    email_uid = Column(String(100))
    email_subject = Column(String(500))
    email_from = Column(String(255))
    email_date = Column(DateTime)
    attachment_count = Column(Integer, default=0)
    attachment_names = Column(JSON, default=list)
    processing_status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="email_log")
