import os
import subprocess
from typing import Optional
from celery import Celery
from app.config import settings

celery_app = Celery(
    "watchme",
    broker=settings.REDIS_URI,
    backend=settings.REDIS_URI,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

RENDITIONS = [
    {"name": "480p", "width": 854, "height": 480, "bitrate": "800k"},
    {"name": "720p", "width": 1280, "height": 720, "bitrate": "2000k"},
    {"name": "1080p", "width": 1920, "height": 1080, "bitrate": "4000k"},
]


@celery_app.task(bind=True, max_retries=3)
def transcode_video(self, input_path: str, title_id: str) -> dict:
    output_dir = f"/tmp/hls/{title_id}"
    os.makedirs(output_dir, exist_ok=True)
    variant_playlists = []
    for rendition in RENDITIONS:
        name = rendition["name"]
        playlist_path = f"{output_dir}/{name}.m3u8"
        cmd = [
            "ffmpeg", "-i", input_path,
            "-vf", f"scale={rendition['width']}:{rendition['height']}",
            "-c:v", "h264",
            "-b:v", rendition["bitrate"],
            "-c:a", "aac",
            "-b:a", "128k",
            "-f", "hls",
            "-hls_time", "6",
            "-hls_list_size", "0",
            "-hls_segment_filename", f"{output_dir}/{name}_%03d.ts",
            playlist_path,
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            variant_playlists.append({"name": name, "url": f"/hls/{title_id}/{name}.m3u8"})
        except subprocess.CalledProcessError as e:
            raise self.retry(exc=e, countdown=60)
    master_playlist = "#EXTM3U\n"
    for v in variant_playlists:
        master_playlist += f"#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080\n{v['url']}\n"
    with open(f"{output_dir}/master.m3u8", "w") as f:
        f.write(master_playlist)
    from app.repositories.catalog_repo import CatalogRepository
    import asyncio
    async def update_hls():
        repo = CatalogRepository()
        await repo.update_title(title_id, {"hls_url": {v["name"]: v["url"] for v in variant_playlists}})
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(update_hls())
    except RuntimeError:
        asyncio.run(update_hls())
    return {
        "title_id": title_id,
        "renditions": variant_playlists,
        "master_playlist": f"/hls/{title_id}/master.m3u8",
    }


@celery_app.task(bind=True, max_retries=3)
def generate_thumbnails(self, title_id: str, input_path: str) -> list[str]:
    output_dir = f"/tmp/thumbnails/{title_id}"
    os.makedirs(output_dir, exist_ok=True)
    thumbs = []
    for i in range(5):
        output_path = f"{output_dir}/thumb_{i}.jpg"
        timestamp = i * 60
        cmd = [
            "ffmpeg", "-i", input_path,
            "-ss", str(timestamp),
            "-vframes", "1",
            "-vf", "scale=320:180",
            output_path,
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            thumbs.append(output_path)
        except subprocess.CalledProcessError as e:
            self.retry(exc=e, countdown=60)
    return thumbs


@celery_app.task(bind=True, max_retries=3)
def sync_to_meilisearch(self, title_id: str) -> dict:
    from app.repositories.catalog_repo import CatalogRepository
    from app.services.search_service import SearchService
    import asyncio
    async def sync():
        repo = CatalogRepository()
        search = SearchService(repo)
        await search.sync_title(title_id)
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(sync())
    except RuntimeError:
        asyncio.run(sync())
    return {"title_id": title_id, "synced": True}
