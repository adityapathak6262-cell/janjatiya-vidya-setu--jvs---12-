from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Janjatiya Vidya Setu (JVS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "jvs_secret_key_mota_super_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # PostgreSQL Configuration
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_USER: str = "jvs_admin"
    POSTGRES_PASSWORD: str = "jvs_secure_password_2026"
    POSTGRES_DB: str = "jvs_mota_db"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis & Background Workers
    REDIS_URL: str = "redis://redis:6379/0"

    # AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
