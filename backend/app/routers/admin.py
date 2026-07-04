import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps.auth_deps import require_admin
from app.deps.db_deps import get_db_session
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.user_repo import UserRepository
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


@router.get("/imports")
async def list_imports(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    user_id = str(admin["id"])
    user_repo = UserRepository(db)
    imports = await user_repo.get_import_history(user_id)
    return {
        "items": [
            {
                "id": i.id,
                "title_name": i.title_name,
                "tmdb_id": i.tmdb_id,
                "media_type": i.media_type,
                "status": i.status,
                "error_message": i.error_message,
                "imported_at": i.imported_at.isoformat() if i.imported_at else None,
            }
            for i in imports
        ],
        "total": len(imports),
    }


@router.post("/tmdb/import")
async def tmdb_import(
    tmdb_id: int,
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    user_id = str(admin["id"])
    user_repo = UserRepository(db)
    existing = await user_repo.check_imported(tmdb_id)
    if existing:
        imported_at = existing.imported_at
        date_str = imported_at.strftime("%Y-%m-%d %H:%M") if imported_at else "unknown"
        raise HTTPException(
            status_code=409,
            detail=f'"{existing.title_name}" was already imported on {date_str}'
        )
    tmdb = TMDBService()
    try:
        if media_type == "tv":
            data = await tmdb.get_tv_details(tmdb_id)
        else:
            data = await tmdb.get_movie_details(tmdb_id)
        if not data:
            raise HTTPException(status_code=404, detail="Title not found on TMDB")
        trailer_url = await tmdb.get_videos(tmdb_id, media_type)
        if trailer_url:
            data["trailer_url"] = trailer_url
        repo = CatalogRepository()
        title_id = await repo.create_title(data)
        await user_repo.log_import(user_id, data.get("title", data.get("name", "")), tmdb_id, media_type, title_id)
        return {"id": title_id, "title": data.get("title", data.get("name", "")), "trailer_url": trailer_url}
    except HTTPException:
        raise
    except Exception as e:
        await user_repo.log_import(user_id, f"TMDB #{tmdb_id}", tmdb_id, media_type, None, "failed", str(e))
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
    finally:
        await tmdb.close()


@router.post("/tmdb/fetch-trailer")
async def fetch_trailer(
    tmdb_id: int,
    media_type: str = Query("movie"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
):
    tmdb = TMDBService()
    try:
        trailer_url = await tmdb.get_videos(tmdb_id, media_type)
        if not trailer_url:
            return {"trailer_url": None, "found": False}
        repo = CatalogRepository()
        user_repo = UserRepository(db)
        found_title = await user_repo.check_imported(tmdb_id)
        if found_title:
            await repo.update_title(found_title.title_id, {"trailer_url": trailer_url})
            return {"trailer_url": trailer_url, "found": True, "title_id": found_title.title_id}
        return {"trailer_url": trailer_url, "found": False, "note": "No matching imported title found"}
    finally:
        await tmdb.close()
