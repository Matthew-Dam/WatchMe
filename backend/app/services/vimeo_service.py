from typing import Optional
from httpx import AsyncClient

VIMEO_OEMBED_URL = "https://vimeo.com/api/oembed.json"


class VimeoService:
    def __init__(self):
        self.client: Optional[AsyncClient] = None

    async def _ensure_client(self):
        if not self.client:
            self.client = AsyncClient(timeout=10)

    async def get_video_info(self, url: str) -> Optional[dict]:
        await self._ensure_client()
        try:
            resp = await self.client.get(VIMEO_OEMBED_URL, params={"url": url})
            if resp.status_code != 200:
                return None
            data = resp.json()
            match = url.rstrip("/").split("/")[-1]
            return {
                "video_id": match,
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "thumbnail": data.get("thumbnail_url", ""),
                "author": data.get("author_name", ""),
                "duration": data.get("duration", 0),
                "embed_url": f"https://player.vimeo.com/video/{match}",
            }
        except Exception:
            return None

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None
