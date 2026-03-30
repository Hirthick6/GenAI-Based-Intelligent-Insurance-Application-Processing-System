"""Script to drop and recreate the applications table."""

from sqlalchemy import text
from app.database import engine
from app.models.models import Application

def fix_applications_table():
    """Drop and recreate applications table."""
    with engine.connect() as conn:
        # Drop dependent tables first
        print("Dropping dependent tables...")
        conn.execute(text("DROP TABLE IF EXISTS validation_results CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS extracted_fields CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS email_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS pages CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS documents CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS applications CASCADE"))
        conn.commit()
        
    print("Recreating tables...")
    Application.metadata.create_all(bind=engine)
    
    # Import and create all related tables
    from app.models.models import Document, Page, ExtractedField, ValidationResult, EmailLog
    Document.metadata.create_all(bind=engine)
    Page.metadata.create_all(bind=engine)
    ExtractedField.metadata.create_all(bind=engine)
    ValidationResult.metadata.create_all(bind=engine)
    EmailLog.metadata.create_all(bind=engine)
    
    print("Tables recreated successfully!")

if __name__ == "__main__":
    fix_applications_table()
