import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from app.config import settings
from app.database.supabase import supabase
from app.database.postgres import postgres
from app.database.redis import redis_client
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_handler import ErrorHandlingMiddleware
from app.routers import auth, catalog, comments, ratings, watchlist, search, upload, titles, subscriptions, admin
from app.routers import auth_oauth, stream, image_proxy
from app.websocket.handlers import router as websocket_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await supabase.connect()
    except Exception as e:
        logger.warning("Supabase unavailable: %s", e)
    try:
        await postgres.connect()
    except Exception as e:
        logger.warning("PostgreSQL unavailable: %s", e)
    try:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations up to date")
    except Exception as e:
        logger.warning("Migration failed (non-fatal): %s", e)
    try:
        from sqlalchemy import text
        from app.database.postgres import engine
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS import_logs_user_id_fkey"))
            await conn.execute(text("ALTER TABLE import_logs ALTER COLUMN id TYPE VARCHAR(36) USING id::varchar"))
            await conn.execute(text("ALTER TABLE import_logs ALTER COLUMN user_id TYPE VARCHAR(36) USING user_id::varchar"))
            await conn.execute(text("ALTER TABLE import_logs ALTER COLUMN title_id TYPE VARCHAR(36) USING title_id::varchar"))
            logger.info("import_logs columns migrated to VARCHAR")
            await conn.execute(text("ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_profile_id_fkey"))
            await conn.execute(text("ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_title_id_fkey"))
            logger.info("foreign key constraints dropped on comments table")
    except Exception as e:
        logger.warning("comments FK drop skipped: %s", e)
    try:
        await redis_client.connect()
    except Exception as e:
        logger.warning("Redis unavailable: %s", e)
    yield
    try:
        await supabase.close()
    except Exception:
        pass
    try:
        await postgres.close()
    except Exception:
        pass
    try:
        await redis_client.close()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

cors_origin_regex = r"https://.*\.vercel\.app"
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
app.add_middleware(ErrorHandlingMiddleware)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(comments.router)
app.include_router(ratings.router)
app.include_router(watchlist.router)
app.include_router(search.router)
app.include_router(upload.router)
app.include_router(titles.router)
app.include_router(subscriptions.router)
app.include_router(auth_oauth.router)
app.include_router(admin.router)
app.include_router(stream.router)
app.include_router(image_proxy.router)
app.include_router(websocket_router)

if settings.DEBUG:
    import os
    hls_dir = "/tmp/hls"
    os.makedirs(hls_dir, exist_ok=True)
    app.mount("/hls", StaticFiles(directory=hls_dir), name="hls")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
