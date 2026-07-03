from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.catalog import SearchResponse
from app.repositories.catalog_repo import CatalogRepository
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


def get_search_service() -> SearchService:
    return SearchService(CatalogRepository())


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(""),
    genre: Optional[str] = Query(None),
    mood: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    has_trailer: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = get_search_service()
    return await service.search(q, genre, mood, content_type, year, has_trailer, page, page_size)
