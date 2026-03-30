"""Check what columns SQLAlchemy thinks the Application model has."""

from app.models.models import Application
from sqlalchemy import inspect

def check_application_columns():
    """Print all columns that SQLAlchemy knows about for Application."""
    mapper = inspect(Application)
    print("Application model columns:")
    for column in mapper.columns:
        print(f"  - {column.name}: {column.type}")

if __name__ == "__main__":
    check_application_columns()
