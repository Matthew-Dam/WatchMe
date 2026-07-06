from typing import Optional
from httpx import AsyncClient

IA_SEARCH_URL = "https://archive.org/advancedsearch.php"
IA_METADATA_URL = "https://archive.org/metadata"
IA_DOWNLOAD_URL = "https://archive.org/download"

SEARCH_FIELDS = [
    "identifier", "title", "description", "creator", "date",
    "avg_rating", "downloads", "collection", "mediatype", "year",
    "runtime", "language",
]


class InternetArchiveService:
    def __init__(self):
        self.client: Optional[AsyncClient] = None

    async def _ensure_client(self):
        if not self.client:
            self.client = AsyncClient(timeout=30)

    async def search(self, query: str, page: int = 1, rows: int = 50) -> dict:
        await self._ensure_client()
        params = {
            "q": f"({query}) AND mediatype:movies",
            "fl[]": SEARCH_FIELDS,
            "sort[]": "downloads desc",
            "rows": rows,
            "page": page,
            "output": "json",
        }
        resp = await self.client.get(IA_SEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        response = data.get("response", {})
        docs = response.get("docs", [])
        num_found = response.get("numFound", 0)
        return {
            "items": [self._transform(doc) for doc in docs],
            "total": num_found,
            "page": page,
            "size": rows,
        }

    async def search_top_feature_films(self, page: int = 1, rows: int = 50) -> dict:
        await self._ensure_client()
        params = {
            "q": "mediatype:movies AND collection:(feature_films OR moviesandfilms OR publicdomainmovies OR opensource_movies OR classic_tv)",
            "fl[]": SEARCH_FIELDS,
            "sort[]": "downloads desc",
            "rows": rows,
            "page": page,
            "output": "json",
        }
        resp = await self.client.get(IA_SEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        response = data.get("response", {})
        docs = response.get("docs", [])
        return {
            "items": [self._transform(doc) for doc in docs],
            "total": response.get("numFound", 0),
            "page": page,
            "size": rows,
        }

    async def search_hd_movies(self, page: int = 1, rows: int = 50) -> dict:
        await self._ensure_client()
        params = {
            "q": "mediatype:movies AND (format:MPEG4 OR format:h.264) AND collection:(feature_films OR moviesandfilms)",
            "fl[]": SEARCH_FIELDS,
            "sort[]": "downloads desc",
            "rows": rows,
            "page": page,
            "output": "json",
        }
        resp = await self.client.get(IA_SEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        response = data.get("response", {})
        docs = response.get("docs", [])
        return {
            "items": [self._transform(doc) for doc in docs],
            "total": response.get("numFound", 0),
            "page": page,
            "size": rows,
        }

    async def get_details(self, identifier: str) -> Optional[dict]:
        await self._ensure_client()
        resp = await self.client.get(f"{IA_METADATA_URL}/{identifier}")
        if resp.status_code != 200:
            return None
        data = resp.json()
        metadata = data.get("metadata", {})
        files = data.get("files", [])

        priority = ("MPEG4", "h.264", "MP4")
        video_files = [f for f in files if f.get("format") in priority + ("512kb MP4",)]
        download_url = None
        for fmt in priority:
            match = next((f for f in video_files if f.get("format") == fmt), None)
            if match and _likely_hd(match):
                download_url = f"{IA_DOWNLOAD_URL}/{identifier}/{match['name']}"
                break

        if not download_url:
            for fmt in priority:
                match = next((f for f in video_files if f.get("format") == fmt), None)
                if match:
                    download_url = f"{IA_DOWNLOAD_URL}/{identifier}/{match['name']}"
                    break

        return {
            "identifier": identifier,
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "creator": metadata.get("creator", ""),
            "date": metadata.get("date", ""),
            "year": metadata.get("year"),
            "runtime": metadata.get("runtime"),
            "language": metadata.get("language"),
            "avg_rating": metadata.get("avg_rating"),
            "downloads": metadata.get("downloads"),
            "collection": metadata.get("collection", []),
            "download_url": download_url,
            "thumb_url": f"https://archive.org/services/img/{identifier}",
        }

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None

    def _transform(self, doc: dict) -> dict:
        return {
            "identifier": doc.get("identifier", ""),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "creator": doc.get("creator", ""),
            "year": doc.get("year", int(str(doc.get("date", ""))[:4]) if doc.get("date") else None),
            "avg_rating": doc.get("avg_rating"),
            "downloads": doc.get("downloads", 0),
            "collection": doc.get("collection", []),
            "thumb_url": f"https://archive.org/services/img/{doc.get('identifier', '')}",
        }


def _likely_hd(file_info: dict) -> bool:
    name = (file_info.get("name") or "").lower()
    source = (file_info.get("source") or "").lower()
    if "512kb" in name or "256kb" in name or "128kb" in name:
        return False
    if source == "original":
        return True
    if "hq" in name or "hd" in name or "high" in name or "720" in name or "1080" in name:
        return True
    size = file_info.get("size", 0)
    if isinstance(size, (int, float)) and size > 200_000_000:
        return True
    return True
