from starlette.types import ASGIApp, Scope, Receive, Send
from starlette.responses import JSONResponse
from starlette.requests import Request
from app.database.redis import redis_client


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, max_requests: int = 100, window_seconds: int = 60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path = scope.get("path", "") or scope.get("root_path", "")
        if path.startswith("/ws"):
            await self.app(scope, receive, send)
            return
        client_ip = scope.get("client", ("unknown", 0))[0]
        key = f"rate_limit:{client_ip}:{path}"
        try:
            client = redis_client.get_client()
            current = await client.get(key)
            if current and int(current) >= self.max_requests:
                resp = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests", "retry_after": self.window_seconds},
                )
                await resp(scope, receive, send)
                return
            pipe = client.pipeline()
            pipe.incr(key, 1)
            pipe.expire(key, self.window_seconds)
            await pipe.execute()
        except Exception:
            pass
        await self.app(scope, receive, send)
