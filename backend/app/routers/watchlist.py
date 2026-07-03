import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps.db_deps import get_db_session
from app.deps.auth_deps import get_current_user
from app.repositories.user_repo import UserRepository
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import TitleSchema

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


def _profile_from_current_user(current_user: dict, profile_id: str) -> dict:
    return {"id": profile_id, "user_id": current_user["id"]}


@router.get("")
async def list_watchlist(
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    repo = UserRepository(db)
    profile = _profile_from_current_user(current_user, profile_id)
    items = await repo.get_watchlist(uuid.UUID(profile["id"]))
    title_ids = [str(item.title_id) for item in items]
    catalog_repo = CatalogRepository()
    titles_map = {}
    if title_ids:
        titles = await catalog_repo.get_titles_by_ids(title_ids)
        titles_map = {t["id"]: t for t in titles}
    result = []
    for item in items:
        tid = str(item.title_id)
        title_data = titles_map.get(tid)
        if title_data:
            title_data = TitleSchema(**title_data).model_dump()
        result.append({
            "id": str(item.id),
            "title_id": tid,
            "profile_id": profile_id,
            "title": title_data or {},
            "added_at": item.added_at.isoformat() if item.added_at else None,
        })
    return {"items": result, "total": len(result), "page": 1, "page_size": len(result)}


@router.post("/{title_id}", status_code=201)
async def add_to_watchlist(
    title_id: str,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    repo = UserRepository(db)
    item = await repo.add_watchlist_item(uuid.UUID(profile_id), uuid.UUID(title_id))
    return {"id": str(item.id), "title_id": title_id, "profile_id": profile_id, "added_at": item.added_at}


@router.delete("/{title_id}")
async def remove_from_watchlist(
    title_id: str,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    repo = UserRepository(db)
    success = await repo.remove_watchlist_item(uuid.UUID(profile_id), uuid.UUID(title_id))
    if not success:
        raise HTTPException(status_code=404, detail="Item not in watchlist")
    return {"message": "Removed from watchlist"}


@router.get("/check/{title_id}")
async def check_watchlist(
    title_id: str,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    repo = UserRepository(db)
    in_list = await repo.check_watchlist_item(uuid.UUID(profile_id), uuid.UUID(title_id))
    return {"in_watchlist": in_list}
