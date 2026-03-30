"""Utility functions for the application."""

import os
import uuid
from datetime import datetime


def fs_path_to_url(path: str, upload_dir: str = "", processed_dir: str = "") -> str:
    """
    Convert a filesystem path to an authenticated API URL for frontend use.
    Uses the /api/files/serve endpoint which requires authentication.
    e.g. 'C:\\backend\\processed\\APP-xxx\\Doc\\page.png' -> '/api/files/serve?path=processed/APP-xxx/Doc/page.png'
    """
    if not path or not str(path).strip():
        return path or ""
    
    path = str(path).replace("\\", "/")
    
    # If already a URL, return as-is
    if path.startswith("/api/files/serve"):
        return path
    
    # Extract the relative path from processed or uploads directory
    relative_path = None
    
    if "processed" in path.lower():
        idx = path.lower().rfind("processed")
        suffix = path[idx + len("processed"):].replace("\\", "/").lstrip("/")
        if suffix:
            relative_path = f"processed/{suffix}"
    elif "uploads" in path.lower():
        idx = path.lower().rfind("uploads")
        suffix = path[idx + len("uploads"):].replace("\\", "/").lstrip("/")
        if suffix:
            relative_path = f"uploads/{suffix}"
    
    # Return authenticated URL
    if relative_path:
        # URL encode the path
        from urllib.parse import quote
        encoded_path = quote(relative_path, safe='/')
        return f"/api/files/serve?path={encoded_path}"
    
    return path


def generate_unique_id(prefix: str = "APP") -> str:
    """Generate a unique ID with timestamp and UUID."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    short_uuid = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{timestamp}-{short_uuid}"


def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB."""
    if os.path.exists(file_path):
        return round(os.path.getsize(file_path) / (1024 * 1024), 2)
    return 0.0


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename for safe storage."""
    filename = os.path.basename(filename)
    dangerous_chars = ['..', '/', '\\', '\x00']
    for char in dangerous_chars:
        filename = filename.replace(char, '')
    return filename
