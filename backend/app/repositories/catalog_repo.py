from typing import Optional
from app.database.supabase import supabase


class CatalogRepository:
    async def create_title(self, data: dict) -> str:
        insert_data = {k: v for k, v in data.items() if k not in ("tmdb_id",)}
        result = await supabase.insert("titles", insert_data, use_service_role=True)
        return result["id"]

    async def update_title(self, title_id: str, data: dict) -> bool:
        return await supabase.update("titles", title_id, data, use_service_role=True)

    async def get_title_by_id(self, title_id: str) -> Optional[dict]:
        return await supabase.select_one("titles", title_id)

    async def list_titles(self, filters: dict, page: int = 1, page_size: int = 20, order: Optional[str] = None) -> tuple[list[dict], int]:
        sb_filters = {"is_published": "eq.true"}
        for key, value in filters.items():
            if value is not None:
                if key in ("genres", "countries", "categories", "mood_tags"):
                    sb_filters[key] = f"cs.{{{value}}}"
                elif key == "year":
                    sb_filters["year"] = f"eq.{value}"
                elif key == "content_type":
                    sb_filters["content_type"] = f"eq.{value}"
                elif key == "has_trailer" and value:
                    sb_filters["trailer_url"] = "not.is.null"
                elif key == "upcoming" and value:
                    from datetime import datetime
                    sb_filters["year"] = f"gte.{datetime.now().year}"
        if not order:
            order = "created_at.desc"
        items, total = await supabase.select(
            "titles", "*", sb_filters, order, page_size, (page - 1) * page_size,
        )
        return items, total

    async def get_featured_titles(self, limit: int = 10) -> list[dict]:
        items, _ = await supabase.select(
            "titles", "*",
            {"is_published": "eq.true"},
            "average_rating.desc",
            limit, 0,
        )
        return items

    async def get_continue_watching(self, title_ids: list[str], limit: int = 20) -> list[dict]:
        if not title_ids:
            return []
        items = await supabase.filter_in(
            "titles", "id", title_ids,
            use_service_role=True,
        )
        return items[:limit]

    async def get_episodes(self, title_id: str) -> list[dict]:
        items, _ = await supabase.select(
            "episodes", "*",
            {"title_id": f"eq.{title_id}"},
            "season_number.asc,episode_number.asc",
            100, 0,
        )
        return items

    async def create_episode(self, data: dict) -> str:
        data.setdefault("created_at", None)
        result = await supabase.insert("episodes", data, use_service_role=True)
        return result["id"]

    async def get_genres(self) -> list[dict]:
        items, _ = await supabase.select("genres", "*", order="name.asc", limit=100)
        return items

    async def get_categories(self) -> list[dict]:
        items, _ = await supabase.select("categories", "*", order="name.asc", limit=100)
        return items

    async def get_countries(self) -> list[dict]:
        items, _ = await supabase.select("countries", "*", order="name.asc", limit=100)
        return items

    async def get_moods(self) -> list[dict]:
        items, _ = await supabase.select("mood_tags", "*", order="name.asc", limit=100)
        return items

    async def create_genre(self, data: dict) -> str:
        result = await supabase.insert("genres", data, use_service_role=True)
        return result["id"]

    async def create_category(self, data: dict) -> str:
        result = await supabase.insert("categories", data, use_service_role=True)
        return result["id"]

    async def create_country(self, data: dict) -> str:
        result = await supabase.insert("countries", data, use_service_role=True)
        return result["id"]

    async def create_mood(self, data: dict) -> str:
        result = await supabase.insert("mood_tags", data, use_service_role=True)
        return result["id"]

    async def delete_genre(self, genre_id: str) -> bool:
        return await supabase.delete("genres", genre_id, use_service_role=True)

    async def delete_country(self, country_id: str) -> bool:
        return await supabase.delete("countries", country_id, use_service_role=True)

    async def delete_category(self, category_id: str) -> bool:
        return await supabase.delete("categories", category_id, use_service_role=True)

    async def delete_mood(self, mood_id: str) -> bool:
        return await supabase.delete("mood_tags", mood_id, use_service_role=True)

    async def get_titles_by_ids(self, ids: list[str]) -> list[dict]:
        if not ids:
            return []
        return await supabase.filter_in("titles", "id", ids)

    async def search_titles(self, query: str, filters: dict, page: int, page_size: int) -> tuple[list[dict], int]:
        sb_filters = {"is_published": "eq.true"}
        for key, value in filters.items():
            if value is not None:
                if key in ("genres", "countries", "categories", "mood_tags"):
                    sb_filters[key] = f"cs.{{{value}}}"
                elif key == "content_type":
                    sb_filters["content_type"] = f"eq.{value}"
                elif key == "year":
                    sb_filters["year"] = f"eq.{value}"
                elif key == "has_trailer" and value:
                    sb_filters["trailer_url"] = "not.is.null"
        search_filter = f"(title.ilike.%{query}%,overview.ilike.%{query}%)"
        sb_filters["or"] = search_filter
        items, total = await supabase.select(
            "titles", "*",
            sb_filters,
            "average_rating.desc", page_size, (page - 1) * page_size,
        )
        return items, total
