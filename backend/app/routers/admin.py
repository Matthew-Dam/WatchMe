from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps.auth_deps import require_admin
from app.repositories.catalog_repo import CatalogRepository
from app.services.tmdb_service import TMDBService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/tmdb/search")
async def tmdb_search(
    query: str = Query(...),
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            results = await tmdb.search_tv(query)
        else:
            results = await tmdb.search_movie(query)
        return {"items": results, "total": len(results)}
    finally:
        await tmdb.close()


@router.get("/tmdb/popular")
async def tmdb_popular(
    media_type: str = Query("movie"),
    page: int = Query(1, ge=1),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            results = await tmdb.get_popular_tv(page)
        else:
            results = await tmdb.get_popular_movies(page)
        return {"items": results, "total": len(results), "page": page}
    finally:
        await tmdb.close()


@router.post("/tmdb/import")
async def tmdb_import(
    tmdb_id: int,
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
):
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            data = await tmdb.get_tv_details(tmdb_id)
        else:
            data = await tmdb.get_movie_details(tmdb_id)
        if not data:
            raise HTTPException(status_code=404, detail="Title not found on TMDB")
        repo = CatalogRepository()
        title_id = await repo.create_title(data)
        return {"id": title_id, "title": data.get("title", data.get("name", ""))}
    finally:
        await tmdb.close()
