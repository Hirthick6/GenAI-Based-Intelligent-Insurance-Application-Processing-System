"""Script to reset the database by dropping and recreating all tables."""

from app.database import Base, engine
from app.models import models  # noqa: F401 - Import to register models

def reset_database():
    """Drop all tables and recreate them."""
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete!")

if __name__ == "__main__":
    reset_database()
