from typing import Optional
from httpx import AsyncClient
from app.config import settings

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


class YouTubeService:
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self.client: Optional[AsyncClient] = None

    async def _ensure_client(self):
        if not self.client:
            self.client = AsyncClient(timeout=15)

    async def search_free_movie(self, title: str, year: Optional[int] = None) -> Optional[str]:
        if not self.api_key:
            return None
        await self._ensure_client()
        queries = [
            f'"{title}" {year} full movie free' if year else f'"{title}" full movie free',
            f'"{title}" {year} free movie' if year else f'"{title}" free movie',
            f'"{title}" full movie',
        ]
        for query in queries:
            try:
                resp = await self.client.get(YOUTUBE_SEARCH_URL, params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "videoDuration": "long",
                    "maxResults": 5,
                    "key": self.api_key,
                })
                if resp.status_code != 200:
                    continue
                data = resp.json()
                for item in data.get("items", []):
                    video_id = item["id"]["videoId"]
                    snippet = item.get("snippet", {})
                    channel = (snippet.get("channelTitle") or "").lower()
                    title_lower = (snippet.get("title") or "").lower()
                    skip_keywords = ("trailer", "teaser", "clip", "scene", "preview", "review", "recap")
                    if any(k in title_lower for k in skip_keywords):
                        continue
                    if any(k in channel for k in ("movies", "films", "official", "free", "full")):
                        return f"https://www.youtube.com/watch?v={video_id}"
                    return f"https://www.youtube.com/watch?v={video_id}"
            except Exception:
                continue
        return None

    async def search_free_movies_batch(self, query: str = "free movie full length", max_results: int = 20) -> list[dict]:
        if not self.api_key:
            return []
        await self._ensure_client()
        try:
            resp = await self.client.get(YOUTUBE_SEARCH_URL, params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "videoDuration": "long",
                "maxResults": min(max_results, 50),
                "key": self.api_key,
                "order": "viewCount",
                "videoDefinition": "high",
            })
            resp.raise_for_status()
            data = resp.json()
            results = []
            for item in data.get("items", []):
                video_id = item["id"]["videoId"]
                snippet = item.get("snippet", {})
                title = (snippet.get("title") or "").replace(" - YouTube", "")
                description = snippet.get("description", "")
                thumb = snippet.get("thumbnails", {}).get("high", {}).get("url", "")
                results.append({
                    "video_id": video_id,
                    "title": title,
                    "description": description[:500],
                    "thumbnail": thumb,
                    "channel": snippet.get("channelTitle", ""),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}?rel=0",
                    "source": "youtube",
                })
            return results
        except Exception:
            return []

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None
