"""
TCE Project - Insurance Document Processing Pipeline
=====================================================
FastAPI application entry point.

Pipeline Flow:
Email → Multiple PDFs → Batch Processing → Page-wise OCR → Docling → JSON → GenAI → Validation → PostgreSQL → React
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, SessionLocal
from app.models import models  # noqa: F401 - Import so tables are registered before init_db
from app.api.routes import router
from app.api.auth_routes import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TCE Insurance Document Processor",
    
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving processed images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/processed", StaticFiles(directory=settings.PROCESSED_DIR), name="processed")

# Include API routes
app.include_router(auth_router, prefix="/api")
app.include_router(router, prefix="/api")


def _seed_admin_if_empty():
    """Create default admin user if no users exist."""
    from app.models.models import User, UserRole
    from app.auth import get_password_hash

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                email="admin@tce.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin",
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            logger.info("Created default admin: admin@tce.com / admin123")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database tables created/verified successfully")
        _seed_admin_if_empty()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    logger.info("TCE Insurance Document Processor started successfully")


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "TCE Insurance Document Processor",
        "version": "1.0.0",
        "pipeline": "Email → PDFs → Batch Processing → OCR → Docling → JSON → GenAI → Validation → PostgreSQL → React",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "tce-document-processor"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
