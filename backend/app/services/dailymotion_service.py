from typing import Optional
from httpx import AsyncClient

DAILYMOTION_API_URL = "https://api.dailymotion.com"
DAILYMOTION_EMBED_URL = "https://www.dailymotion.com/embed/video"


class DailymotionService:
    def __init__(self):
        self.client: Optional[AsyncClient] = None

    async def _ensure_client(self):
        if not self.client:
            self.client = AsyncClient(base_url=DAILYMOTION_API_URL, timeout=15)

    async def search_free_movie(self, title: str, year: Optional[int] = None) -> Optional[str]:
        await self._ensure_client()
        queries = [
            f'"{title}" {year} full movie' if year else f'"{title}" full movie',
            f'"{title}" {year} free movie' if year else f'"{title}" free movie',
            f'"{title}" movie',
        ]
        for query in queries:
            try:
                resp = await self.client.get("/videos", params={
                    "search": query,
                    "fields": "id,title,owner.screenname",
                    "limit": 5,
                    "sort": "relevance",
                    "flags": "no_live,no_premium",
                })
                if resp.status_code != 200:
                    continue
                data = resp.json()
                for item in data.get("list", []):
                    video_id = item.get("id")
                    if not video_id:
                        continue
                    title_lower = (item.get("title") or "").lower()
                    skip_keywords = ("trailer", "teaser", "clip", "scene", "preview", "review")
                    if any(k in title_lower for k in skip_keywords):
                        continue
                    return video_id
            except Exception:
                continue
        return None

    async def search_free_movies_batch(self, query: str = "full movie free", max_results: int = 30) -> list[dict]:
        await self._ensure_client()
        try:
            resp = await self.client.get("/videos", params={
                "search": query,
                "fields": "id,title,owner.screenname,thumbnail_720_url,description,created_time",
                "limit": min(max_results, 50),
                "sort": "visited",
                "flags": "no_live,no_premium",
            })
            resp.raise_for_status()
            data = resp.json()
            results = []
            for item in data.get("list", []):
                video_id = item.get("id")
                if not video_id:
                    continue
                title = (item.get("title") or "").replace(" - Dailymotion", "").replace(" - Daily Motion", "")
                results.append({
                    "video_id": video_id,
                    "title": title,
                    "description": (item.get("description") or "")[:500],
                    "thumbnail": item.get("thumbnail_720_url", ""),
                    "channel": item.get("owner.screenname", ""),
                    "url": f"https://www.dailymotion.com/video/{video_id}",
                    "embed_url": f"{DAILYMOTION_EMBED_URL}/{video_id}",
                    "source": "dailymotion",
                })
            return results
        except Exception:
            return []

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None
