from typing import Callable
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
        except ValueError as e:
            return JSONResponse(status_code=400, content={"detail": str(e)})
        except PermissionError as e:
            return JSONResponse(status_code=403, content={"detail": str(e)})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JSONResponse(status_code=500, content={"detail": str(e), "type": type(e).__name__})


error_handling_middleware = ErrorHandlingMiddleware
