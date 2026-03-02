from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PORT: int = 8000
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/agrogebeya"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
