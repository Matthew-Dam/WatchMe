from typing import Optional
from httpx import AsyncClient
from app.config import settings

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"


class TMDBService:
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.client = None

    async def _ensure_client(self):
        if not self.client:
            self.client = AsyncClient(
                base_url=TMDB_BASE_URL,
                params={"api_key": self.api_key},
                timeout=30,
            )

    async def search_movie(self, query: str, page: int = 1) -> list[dict]:
        await self._ensure_client()
        resp = await self.client.get("/search/movie", params={"query": query, "page": page})
        resp.raise_for_status()
        data = resp.json()
        return [self._transform_movie(r) for r in data.get("results", [])]

    async def search_tv(self, query: str, page: int = 1) -> list[dict]:
        await self._ensure_client()
        resp = await self.client.get("/search/tv", params={"query": query, "page": page})
        resp.raise_for_status()
        data = resp.json()
        return [self._transform_tv(r) for r in data.get("results", [])]

    async def get_movie_details(self, tmdb_id: int) -> Optional[dict]:
        await self._ensure_client()
        resp = await self.client.get(f"/movie/{tmdb_id}")
        if resp.status_code != 200:
            return None
        data = resp.json()
        return self._transform_movie(data)

    async def get_tv_details(self, tmdb_id: int) -> Optional[dict]:
        await self._ensure_client()
        resp = await self.client.get(f"/tv/{tmdb_id}")
        if resp.status_code != 200:
            return None
        data = resp.json()
        return self._transform_tv(data)

    async def get_popular_movies(self, page: int = 1) -> list[dict]:
        await self._ensure_client()
        resp = await self.client.get("/movie/popular", params={"page": page})
        resp.raise_for_status()
        data = resp.json()
        return [self._transform_movie(r) for r in data.get("results", [])]

    async def get_popular_tv(self, page: int = 1) -> list[dict]:
        await self._ensure_client()
        resp = await self.client.get("/tv/popular", params={"page": page})
        resp.raise_for_status()
        data = resp.json()
        return [self._transform_tv(r) for r in data.get("results", [])]

    async def get_videos(self, tmdb_id: int, media_type: str = "movie") -> Optional[str]:
        await self._ensure_client()
        endpoint = f"/{media_type}/{tmdb_id}/videos"
        try:
            resp = await self.client.get(endpoint)
            resp.raise_for_status()
            data = resp.json()
            for video in data.get("results", []):
                if video.get("site") == "YouTube" and video.get("type") in ("Trailer", "Teaser"):
                    return f"https://www.youtube.com/watch?v={video['key']}"
        except Exception:
            pass
        return None

    async def get_genres(self, media_type: str = "movie") -> list[dict]:
        await self._ensure_client()
        endpoint = f"/genre/{media_type}/list"
        resp = await self.client.get(endpoint)
        resp.raise_for_status()
        return resp.json().get("genres", [])

    def _transform_movie(self, data: dict) -> dict:
        return {
            "tmdb_id": data.get("id"),
            "title": data.get("title", ""),
            "description": data.get("overview", ""),
            "year": (
                int(data["release_date"][:4])
                if data.get("release_date") and len(data["release_date"]) >= 4
                else 0
            ),
            "duration": data.get("runtime", 0) or 0,
            "poster_url": f"{TMDB_IMAGE_BASE}/w500{data['poster_path']}" if data.get("poster_path") else None,
            "backdrop_url": f"{TMDB_IMAGE_BASE}/original{data['backdrop_path']}" if data.get("backdrop_path") else None,
            "genres": [g["name"] for g in data.get("genres", [])],
            "cast_list": [],
            "crew": {},
            "content_type": "movie",
            "is_published": True,
        }

    def _transform_tv(self, data: dict) -> dict:
        return {
            "tmdb_id": data.get("id"),
            "title": data.get("name", ""),
            "description": data.get("overview", ""),
            "year": (
                int(data["first_air_date"][:4])
                if data.get("first_air_date") and len(data["first_air_date"]) >= 4
                else 0
            ),
            "duration": data.get("episode_run_time", [0])[0] if data.get("episode_run_time") else 0,
            "poster_url": f"{TMDB_IMAGE_BASE}/w500{data['poster_path']}" if data.get("poster_path") else None,
            "backdrop_url": f"{TMDB_IMAGE_BASE}/original{data['backdrop_path']}" if data.get("backdrop_path") else None,
            "genres": [g["name"] for g in data.get("genres", [])],
            "cast_list": [],
            "crew": {},
            "content_type": "tv",
            "is_published": True,
        }

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None
