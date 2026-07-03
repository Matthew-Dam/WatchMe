from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, Response
from app.repositories.catalog_repo import CatalogRepository

router = APIRouter(prefix="/stream", tags=["Stream"])


@router.get("/{title_id}/master.m3u8")
async def get_master_playlist(title_id: str):
    repo = CatalogRepository()
    title = await repo.get_title_by_id(title_id)
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")

    hls_url = title.get("hls_url")
    if not hls_url:
        raise HTTPException(status_code=404, detail="No video stream available for this title")

    if isinstance(hls_url, str) and hls_url.startswith("http"):
        return RedirectResponse(url=hls_url)

    if isinstance(hls_url, dict):
        url = hls_url.get("default")
        if url:
            return RedirectResponse(url=url)

    raise HTTPException(status_code=404, detail="No video stream available for this title")
