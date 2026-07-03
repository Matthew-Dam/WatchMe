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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await supabase.connect()
    await postgres.connect()
    await redis_client.connect()
    yield
    await supabase.close()
    await postgres.close()
    await redis_client.close()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
