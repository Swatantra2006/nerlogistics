"""
NER Logistics Intelligence — Database Configuration
SQLAlchemy engine, session, and base model setup.
Supports both SQLite (dev) and PostgreSQL+PostGIS (production).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


# Engine configuration
connect_args = {}
if settings.is_sqlite:
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# Enable WAL mode for SQLite for better concurrent access
if settings.is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called on startup."""
    Base.metadata.create_all(bind=engine)
