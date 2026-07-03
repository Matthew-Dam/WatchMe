import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.catalog import (
    TitleSchema, TitleListSchema, TitleDetailSchema, TitleCreate, TitleUpdate,
    GenreSchema, CategorySchema, CountrySchema, MoodTagSchema,
)
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.user_repo import UserRepository
from app.services.catalog_service import CatalogService
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user, require_admin

router = APIRouter(prefix="/catalog", tags=["Catalog"])


def get_catalog_service() -> CatalogService:
    return CatalogService(CatalogRepository())


@router.get("/titles", response_model=TitleListSchema)
async def list_titles(
    genre: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    mood: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    has_trailer: Optional[bool] = Query(None),
    upcoming: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("desc"),
    kid_mode: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = get_catalog_service()
    return await service.list_titles(genre, country, category, year, mood, content_type, has_trailer, upcoming, sort_by, sort_order, page, page_size, is_kid_mode=kid_mode)


@router.get("/titles/{title_id}", response_model=TitleDetailSchema)
async def get_title(title_id: str, kid_mode: bool = Query(False)):
    service = get_catalog_service()
    title = await service.get_title(title_id, is_kid_mode=kid_mode)
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    return TitleDetailSchema(**title)


@router.post("/titles", response_model=dict, status_code=201)
async def create_title(data: TitleCreate, admin: dict = Depends(require_admin)):
    service = get_catalog_service()
    title_id = await service.create_title(data.model_dump(exclude_none=True))
    return {"id": title_id}


@router.put("/titles/{title_id}")
async def update_title(title_id: str, data: TitleUpdate, admin: dict = Depends(require_admin)):
    service = get_catalog_service()
    success = await service.update_title(title_id, data.model_dump(exclude_none=True))
    if not success:
        raise HTTPException(status_code=404, detail="Title not found")
    return {"message": "Title updated"}


@router.get("/genres", response_model=list[GenreSchema])
async def list_genres(kid_mode: bool = Query(False)):
    service = get_catalog_service()
    return await service.get_genres(is_kid_mode=kid_mode)


@router.post("/genres", status_code=201)
async def create_genre(name: str, slug: str, description: Optional[str] = None, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    genre_id = await repo.create_genre({"name": name, "slug": slug, "description": description})
    return {"id": genre_id}


@router.delete("/genres/{genre_id}")
async def delete_genre(genre_id: str, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    success = await repo.delete_genre(genre_id)
    if not success:
        raise HTTPException(status_code=404, detail="Genre not found")
    return {"message": "Genre deleted"}


@router.get("/countries", response_model=list[CountrySchema])
async def list_countries():
    service = get_catalog_service()
    return await service.get_countries()


@router.post("/countries", status_code=201)
async def create_country(name: str, slug: str, description: Optional[str] = None, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    country_id = await repo.create_country({"name": name, "slug": slug, "description": description})
    return {"id": country_id}


@router.delete("/countries/{country_id}")
async def delete_country(country_id: str, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    success = await repo.delete_country(country_id)
    if not success:
        raise HTTPException(status_code=404, detail="Country not found")
    return {"message": "Country deleted"}


@router.get("/categories", response_model=list[CategorySchema])
async def list_categories():
    service = get_catalog_service()
    return await service.get_categories()


@router.post("/categories", status_code=201)
async def create_category(name: str, slug: str, description: Optional[str] = None, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    cat_id = await repo.create_category({"name": name, "slug": slug, "description": description})
    return {"id": cat_id}


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    success = await repo.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}


@router.get("/moods", response_model=list[MoodTagSchema])
async def list_moods():
    service = get_catalog_service()
    return await service.get_moods()


@router.post("/moods", status_code=201)
async def create_mood(name: str, slug: str, description: Optional[str] = None, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    mood_id = await repo.create_mood({"name": name, "slug": slug, "description": description})
    return {"id": mood_id}


@router.delete("/moods/{mood_id}")
async def delete_mood(mood_id: str, admin: dict = Depends(require_admin)):
    repo = CatalogRepository()
    success = await repo.delete_mood(mood_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mood not found")
    return {"message": "Mood deleted"}


@router.get("/featured", response_model=list[TitleSchema])
async def get_featured(limit: int = Query(10, ge=1, le=50), kid_mode: bool = Query(False)):
    service = get_catalog_service()
    titles = await service.get_featured(limit, is_kid_mode=kid_mode)
    return [TitleSchema(**t) for t in titles]


@router.get("/continue-watching", response_model=list[TitleSchema])
async def continue_watching(
    profile_id: str = Query(...),
    kid_mode: bool = Query(False),
    db: AsyncSession = Depends(get_db_session),
):
    user_repo = UserRepository(db)
    history = await user_repo.get_watch_history(uuid.UUID(profile_id), limit=20)
    title_ids = [str(h.title_id) for h in history if not h.completed]
    if not title_ids:
        return []
    service = get_catalog_service()
    return await service.get_continue_watching(title_ids, is_kid_mode=kid_mode)
