import uuid
from collections import defaultdict
from typing import Optional
from app.repositories.user_repo import UserRepository
from app.repositories.catalog_repo import CatalogRepository


class RecommendationService:
    def __init__(self, user_repo: UserRepository, catalog_repo: CatalogRepository):
        self.user_repo = user_repo
        self.catalog_repo = catalog_repo

    async def get_personalized_rows(self, profile_id: uuid.UUID, limit: int = 10) -> list[dict]:
        rows = []
        featured = await self.catalog_repo.get_featured_titles(limit)
        if featured:
            rows.append({"name": "Featured", "titles": featured})
        watch_history = await self.user_repo.get_watch_history(profile_id, limit=5)
        if watch_history:
            history_ids = [str(h.title_id) for h in watch_history]
            similar = await self._get_similar_titles(history_ids, limit)
            if similar:
                rows.append({"name": "Because You Watched", "titles": similar})
        genre_rows = await self._get_genre_based_rows(profile_id, limit)
        rows.extend(genre_rows)
        return rows

    async def _get_similar_titles(self, title_ids: list[str], limit: int = 10) -> list[dict]:
        titles = await self.catalog_repo.get_continue_watching(title_ids, limit=limit)
        if not titles:
            return []
        genre_sets = [set(t.get("genres", [])) for t in titles]
        if not genre_sets:
            return []
        common_genres = set.intersection(*genre_sets) if len(genre_sets) > 1 else genre_sets[0]
        if not common_genres:
            return []
        similar, _ = await self.catalog_repo.list_titles(
            {"genres": list(common_genres)[0]}, page=1, page_size=limit
        )
        seen = set(title_ids)
        return [t for t in similar if t["id"] not in seen][:limit]

    async def _get_genre_based_rows(self, profile_id: uuid.UUID, limit: int = 10) -> list[dict]:
        rows = []
        watchlist = await self.user_repo.get_watchlist(profile_id)
        if watchlist:
            watchlist_ids = [str(w.title_id) for w in watchlist]
            titles = await self.catalog_repo.get_continue_watching(watchlist_ids, limit=3)
            for t in titles:
                genres = t.get("genres", [])
                for genre in genres[:2]:
                    items, _ = await self.catalog_repo.list_titles(
                        {"genres": genre}, page=1, page_size=limit
                    )
                    if items:
                        rows.append({"name": f"More {genre}", "titles": items})
                    if len(rows) >= 5:
                        return rows
        return rows
