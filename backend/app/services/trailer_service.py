from typing import Optional
import httpx
from app.config import settings


class TrailerService:
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self.base_url = "https://www.googleapis.com/youtube/v3/search"

    async def search_trailer(self, title: str, year: Optional[int] = None) -> Optional[str]:
        if not self.api_key:
            return self._get_fallback_url(title)
        query = f"{title} official trailer"
        if year:
            query += f" {year}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.base_url, params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": 1,
                    "key": self.api_key,
                })
                resp.raise_for_status()
                data = resp.json()
                items = data.get("items", [])
                if items:
                    video_id = items[0]["id"]["videoId"]
                    return f"https://www.youtube.com/watch?v={video_id}"
        except Exception:
            pass
        return self._get_fallback_url(title)

    def _get_fallback_url(self, title: str) -> str:
        search = title.lower().replace(" ", "+") + "+trailer"
        return f"https://www.youtube.com/results?search_query={search}"
