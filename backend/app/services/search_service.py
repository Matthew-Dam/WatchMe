from typing import Optional
from app.config import settings
from app.repositories.catalog_repo import CatalogRepository

try:
    import meilisearch
    HAS_MEILISEARCH = True
except ImportError:
    HAS_MEILISEARCH = False


class SearchService:
    def __init__(self, catalog_repo: CatalogRepository):
        self.catalog_repo = catalog_repo
        self._client = None

    @property
    def client(self):
        if not HAS_MEILISEARCH:
            return None
        if self._client is None:
            self._client = meilisearch.Client(
                settings.MEILISEARCH_URL,
                settings.MEILISEARCH_API_KEY or None,
            )
        return self._client

    async def search(self, query: str, genre: Optional[str] = None, mood: Optional[str] = None, content_type: Optional[str] = None, year: Optional[int] = None, has_trailer: Optional[bool] = None, page: int = 1, page_size: int = 20) -> dict:
        if self.client and query:
            try:
                return await self._meili_search(query, genre, mood, content_type, year, has_trailer, page, page_size)
            except Exception:
                pass
        filters = {}
        if genre:
            filters["genres"] = genre
        if mood:
            filters["mood_tags"] = mood
        if content_type:
            filters["content_type"] = content_type
        if year:
            filters["year"] = year
        if has_trailer:
            filters["has_trailer"] = True
        items, total = await self.catalog_repo.search_titles(query, filters, page, page_size)
        return {"items": items, "total": total, "page": page, "page_size": page_size, "query": query}

    async def _meili_search(self, query: str, genre: Optional[str] = None, mood: Optional[str] = None, content_type: Optional[str] = None, year: Optional[int] = None, has_trailer: Optional[bool] = None, page: int = 1, page_size: int = 20) -> dict:
        index = self.client.index("titles")
        filter_parts = []
        if genre:
            filter_parts.append(f"genres = {genre}")
        if mood:
            filter_parts.append(f"mood_tags = {mood}")
        if content_type:
            filter_parts.append(f"content_type = {content_type}")
        if year:
            filter_parts.append(f"year = {year}")
        if has_trailer:
            filter_parts.append("trailer_url IS NOT NULL")
        search_params = {
            "limit": page_size,
            "offset": (page - 1) * page_size,
            "filter": " AND ".join(filter_parts) if filter_parts else None,
            "sort": ["average_rating:desc"],
        }
        result = index.search(query, search_params)
        items = [
            {
                "id": h["id"],
                "title": h.get("title", ""),
                "description": h.get("description", ""),
                "year": h.get("year", 0),
                "duration": h.get("duration", 0),
                "poster_url": h.get("poster_url"),
                "backdrop_url": h.get("backdrop_url"),
                "trailer_url": h.get("trailer_url"),
                "genres": h.get("genres", []),
                "countries": h.get("countries", []),
                "categories": h.get("categories", []),
                "mood_tags": h.get("mood_tags", []),
                "content_type": h.get("content_type", "movie"),
                "average_rating": h.get("average_rating", 0.0),
                "total_ratings": h.get("total_ratings", 0),
                "is_published": h.get("is_published", True),
                "created_at": h.get("created_at"),
            }
            for h in result.get("hits", [])
        ]
        total = result.get("estimatedTotalHits", len(items))
        return {"items": items, "total": total, "page": page, "page_size": page_size, "query": query}

    async def sync_title(self, title_id: str) -> None:
        if not self.client:
            return
        title = await self.catalog_repo.get_title_by_id(title_id)
        if not title:
            return
        try:
            index = self.client.index("titles")
            doc = {
                "id": title["id"],
                "title": title.get("title", ""),
                "description": title.get("description", ""),
                "year": title.get("year", 0),
                "duration": title.get("duration", 0),
                "poster_url": title.get("poster_url"),
                "backdrop_url": title.get("backdrop_url"),
                "trailer_url": title.get("trailer_url"),
                "genres": title.get("genres", []),
                "countries": title.get("countries", []),
                "categories": title.get("categories", []),
                "mood_tags": title.get("mood_tags", []),
                "content_type": title.get("content_type", "movie"),
                "average_rating": title.get("average_rating", 0.0),
                "total_ratings": title.get("total_ratings", 0),
                "is_published": title.get("is_published", True),
                "created_at": str(title.get("created_at", "")),
            }
            index.add_documents([doc])
        except Exception:
            pass

    async def setup_index(self) -> None:
        if not self.client:
            return
        try:
            index = self.client.index("titles")
            index.update_filterable_attributes([
                "genres", "mood_tags", "content_type", "year", "trailer_url",
            ])
            index.update_sortable_attributes([
                "average_rating", "year", "created_at",
            ])
            index.update_searchable_attributes([
                "title", "description",
            ])
        except Exception:
            pass
