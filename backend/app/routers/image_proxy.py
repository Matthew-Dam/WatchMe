from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from httpx import AsyncClient

TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

router = APIRouter(prefix="/image", tags=["Image"])


@router.get("/{path:path}")
async def proxy_image(path: str):
    if path.startswith("http://") or path.startswith("https://"):
        url = path
    else:
        url = f"{TMDB_IMAGE_BASE}/{path.lstrip('/')}"
    async with AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Image not found")
        return Response(
            content=resp.content,
            media_type=resp.headers.get("content-type", "image/jpeg"),
        )
