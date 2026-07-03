from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "WatchMe"
    DEBUG: bool = True

    # MongoDB (being phased out)
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "watchme"

    # PostgreSQL (local, for auth/user data)
    POSTGRES_URI: str = "postgresql+asyncpg://watchme:watchme@localhost:5432/watchme"
    POSTGRES_URI_SYNC: str = "postgresql://watchme:watchme@localhost:5432/watchme"

    # Supabase
    SUPABASE_URL: str = "https://fpplwgreqwmplmusjcfu.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_pPHrJba0jlcRCJx8xVKFxA_gaT1SUq6"
    SUPABASE_SERVICE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcGx3Z3JlcXdtcGxtdXNqY2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk4MzEzNSwiZXhwIjoyMDk4NTU5MTM1fQ.H-ww-Ic1e31N1yjJJWZigv2zbec6Uu8z_56VbZcY9Vw"

    # YouTube
    YOUTUBE_API_KEY: str = ""

    # Redis
    REDIS_URI: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "watchme-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # S3 / Media
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "watchme-media"
    S3_REGION: str = "us-east-1"
    CDN_URL: str = "http://localhost:9000"

    # TMDB
    TMDB_API_KEY: str = ""

    # Meilisearch
    MEILISEARCH_URL: str = "http://localhost:7700"
    MEILISEARCH_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
