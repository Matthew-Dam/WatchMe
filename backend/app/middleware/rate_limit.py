import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.database.redis import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path.startswith("/ws"):
            return await call_next(request)
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{client_ip}:{request.url.path}"
        try:
            client = redis_client.get_client()
            current = await client.get(key)
            if current and int(current) >= self.max_requests:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests", "retry_after": self.window_seconds},
                )
            pipe = client.pipeline()
            pipe.incr(key, 1)
            pipe.expire(key, self.window_seconds)
            await pipe.execute()
        except Exception:
            pass
        return await call_next(request)
