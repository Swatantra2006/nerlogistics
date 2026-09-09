"""
Authentication API router: JWT Token generation, User Registration, and Role Management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import hmac
import base64
import json
from app.database import get_db
from app.models.auth import User
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    fullName: Optional[str] = None
    role: Optional[str] = "OPERATOR"


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: dict


def _hash_password(password: str) -> str:
    return hashlib.sha256((password + settings.SECRET_KEY).encode()).hexdigest()


def _create_token(data: dict) -> str:
    """Lightweight self-contained signed token."""
    payload = dict(data)
    payload["exp"] = (datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def _verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        body, signature = parts
        expected = hmac.new(settings.SECRET_KEY.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body.encode()).decode())
        if payload.get("exp", 0) < datetime.utcnow().timestamp():
            return None
        return payload
    except Exception:
        return None


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or user.hashed_password != _hash_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = _create_token({"sub": user.username, "role": user.role, "id": user.id})
    return AuthResponse(
        accessToken=token,
        tokenType="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
        },
    )


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == request.username) | (User.email == request.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    user = User(
        username=request.username,
        email=request.email,
        hashed_password=_hash_password(request.password),
        full_name=request.fullName or request.username,
        role=request.role or "OPERATOR",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token({"sub": user.username, "role": user.role, "id": user.id})
    return AuthResponse(
        accessToken=token,
        tokenType="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role,
        },
    )


@router.get("/me")
def get_current_user():
    return {
        "username": "admin",
        "role": "ADMIN",
        "name": "NER Logistics Director",
        "organization": "North Eastern Logistics Development Council",
    }
