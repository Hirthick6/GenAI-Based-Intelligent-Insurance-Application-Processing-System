"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings
from pydantic import model_validator
from dotenv import load_dotenv

load_dotenv()

# Backend root directory (parent of app/)
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _resolve_path(path: str) -> str:
    """Resolve path to absolute; relative paths are relative to backend root."""
    if not path:
        return path
    if not os.path.isabs(path):
        path = os.path.join(_BACKEND_ROOT, path.lstrip("./"))
    return os.path.normpath(path)


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tce_project"

    # Email IMAP
    IMAP_SERVER: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    IMAP_EMAIL: str = ""
    IMAP_PASSWORD: str = ""
    IMAP_FOLDER: str = "INBOX"

    # GenAI
    GROQ_API_KEY: str = ""
    GENAI_PROVIDER: str = "groq"

    # Tesseract
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    # File Storage (relative paths resolved from backend root)
    UPLOAD_DIR: str = "uploads"
    PROCESSED_DIR: str = "processed"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Auth
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    @model_validator(mode="after")
    def resolve_storage_paths(self):
        self.UPLOAD_DIR = _resolve_path(self.UPLOAD_DIR)
        self.PROCESSED_DIR = _resolve_path(self.PROCESSED_DIR)
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
