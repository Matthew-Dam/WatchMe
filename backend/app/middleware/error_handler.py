from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Scope, Receive, Send


class ErrorHandlingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except ValueError as e:
            resp = JSONResponse(status_code=400, content={"detail": str(e)})
            await resp(scope, receive, send)
        except PermissionError as e:
            resp = JSONResponse(status_code=403, content={"detail": str(e)})
            await resp(scope, receive, send)
        except Exception as e:
            import traceback
            traceback.print_exc()
            resp = JSONResponse(status_code=500, content={"detail": str(e), "type": type(e).__name__})
            await resp(scope, receive, send)


error_handling_middleware = ErrorHandlingMiddleware
