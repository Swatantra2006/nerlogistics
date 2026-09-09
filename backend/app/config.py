"""
NER Logistics Intelligence — Application Settings
Loads configuration from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./ner_logistics.db"

    # AI Provider
    AI_PROVIDER: str = "demo"  # gemini | openai | demo
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None

    # JWT
    JWT_SECRET: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000,https://nerlogistics.vercel.app"

    # External APIs
    WEATHER_API_KEY: Optional[str] = None
    ROUTING_API_KEY: Optional[str] = None
    DISASTER_API_KEY: Optional[str] = None

    # App
    APP_NAME: str = "NER Logistics Intelligence API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    DEMO_MODE: bool = True

    @property
    def PROJECT_NAME(self) -> str:
        return self.APP_NAME

    @property
    def VERSION(self) -> str:
        return self.APP_VERSION

    @property
    def SECRET_KEY(self) -> str:
        return self.JWT_SECRET

    @property
    def ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        return self.JWT_EXPIRATION_MINUTES

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
