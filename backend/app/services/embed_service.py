import logging
from typing import Optional

logger = logging.getLogger(__name__)

EMBED_PROVIDERS: dict[str, str] = {
    "vidsrc": "https://vidsrc.to/embed/{media_type}/{tmdb_id}",
    "2embed": "https://www.2embed.cc/embed/{media_type}/{tmdb_id}",
    "multiembed": "https://multiembed.mom/directstream.php?video_id={tmdb_id}&tmdb=1",
}


class EmbedService:
    def get_embed_url(self, tmdb_id: int, media_type: str = "movie") -> Optional[str]:
        for name, template in EMBED_PROVIDERS.items():
            url = template.format(tmdb_id=tmdb_id, media_type=media_type)
            logger.info(f"Embed [{name}]: {url}")
            return url
        return None
