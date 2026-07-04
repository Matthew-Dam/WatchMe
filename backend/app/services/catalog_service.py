import math
from typing import Optional
from app.repositories.catalog_repo import CatalogRepository

KID_SAFE_CONTENT_TYPES = ["movie", "tv"]
KID_RESTRICTED_GENRES = [
    "horror", "thriller", "crime", "erotic", "adult",
    "war", "psychological horror", "slasher",
]


class CatalogService:
    def __init__(self, catalog_repo: CatalogRepository):
        self.repo = catalog_repo

    async def create_title(self, data: dict) -> str:
        return await self.repo.create_title(data)

    async def update_title(self, title_id: str, data: dict) -> bool:
        return await self.repo.update_title(title_id, data)

    async def get_title(self, title_id: str, is_kid_mode: bool = False) -> Optional[dict]:
        title = await self.repo.get_title_by_id(title_id)
        if not title:
            return None
        if is_kid_mode and self._is_kid_restricted(title):
            return None
        episodes = await self.repo.get_episodes(title_id)
        title["episodes"] = episodes
        return title

    async def list_titles(self, genre: Optional[str] = None, country: Optional[str] = None, category: Optional[str] = None, year: Optional[int] = None, mood: Optional[str] = None, content_type: Optional[str] = None, has_trailer: Optional[bool] = None, upcoming: Optional[bool] = None, sort_by: Optional[str] = None, sort_order: Optional[str] = None, page: int = 1, page_size: int = 20, is_kid_mode: bool = False) -> dict:
        filters = {
            "genres": genre,
            "countries": country,
            "categories": category,
            "year": year,
            "mood_tags": mood,
            "content_type": content_type,
            "has_trailer": has_trailer,
            "upcoming": upcoming,
        }
        order = None
        if sort_by:
            direction = "desc" if sort_order == "desc" else "asc"
            order = f"{sort_by}.{direction}"
        items, total = await self.repo.list_titles(filters, page, page_size, order)
        if is_kid_mode:
            items = [t for t in items if not self._is_kid_restricted(t)]
            total = len(items)
        return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total > 0 else 0, "size": page_size}

    async def get_featured(self, limit: int = 10, is_kid_mode: bool = False) -> list[dict]:
        titles = await self.repo.get_featured_titles(limit)
        if is_kid_mode:
            titles = [t for t in titles if not self._is_kid_restricted(t)]
        return titles

    async def get_continue_watching(self, title_ids: list[str], limit: int = 20, is_kid_mode: bool = False) -> list[dict]:
        if not title_ids:
            return []
        titles = await self.repo.get_continue_watching(title_ids, limit)
        if is_kid_mode:
            titles = [t for t in titles if not self._is_kid_restricted(t)]
        return titles

    async def get_genres(self, is_kid_mode: bool = False) -> list[dict]:
        genres = await self.repo.get_genres()
        if is_kid_mode:
            genres = [g for g in genres if g.get("name", "").lower() not in KID_RESTRICTED_GENRES]
        return genres

    async def get_categories(self) -> list[dict]:
        return await self.repo.get_categories()

    async def get_countries(self) -> list[dict]:
        return await self.repo.get_countries()

    async def get_moods(self) -> list[dict]:
        return await self.repo.get_moods()

    async def search(self, query: str, filters: dict, page: int, page_size: int, is_kid_mode: bool = False) -> dict:
        items, total = await self.repo.search_titles(query, filters, page, page_size)
        if is_kid_mode:
            items = [t for t in items if not self._is_kid_restricted(t)]
            total = len(items)
        return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total > 0 else 0, "size": page_size, "query": query}

    def _is_kid_restricted(self, title: dict) -> bool:
        genre_names = [g.lower() if isinstance(g, str) else g.get("name", "").lower() for g in title.get("genres", [])]
        return any(g in KID_RESTRICTED_GENRES for g in genre_names)
