"""Check extraction percentage in database."""

from app.database import SessionLocal
from app.models.models import Application

def check_extraction():
    db = SessionLocal()
    try:
        apps = db.query(Application).order_by(Application.created_at.desc()).limit(3).all()
        print("\nRecent Applications:")
        for app in apps:
            print(f"\nApplication: {app.application_id}")
            print(f"  Status: {app.status}")
            print(f"  Confidence: {app.confidence_score}")
            print(f"  Extraction %: {app.extraction_percentage}")
            print(f"  Extracted Data Keys: {list(app.extracted_data.keys()) if app.extracted_data else 'None'}")
    finally:
        db.close()

if __name__ == "__main__":
    check_extraction()
