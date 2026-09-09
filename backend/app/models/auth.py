"""
Auth model: User with roles.
"""

from sqlalchemy import Column, String, Integer, Boolean
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    role = Column(String(20), default="USER")  # USER | OPERATOR | ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(String(30), nullable=True, default=lambda: datetime.utcnow().isoformat())
