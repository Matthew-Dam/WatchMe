import uuid
from typing import Optional
from datetime import timedelta
from app.config import settings

try:
    import boto3
    from botocore.config import Config as BotoConfig
    HAS_BOTO = True
except ImportError:
    HAS_BOTO = False


class MediaService:
    def __init__(self):
        self.client = None
        if HAS_BOTO:
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                config=BotoConfig(signature_version="s3v4"),
            )

    async def generate_presigned_upload_url(self, filename: str, content_type: str) -> dict:
        if not self.client:
            return {"url": f"{settings.CDN_URL}/{settings.S3_BUCKET}/uploads/{filename}", "key": f"uploads/{filename}"}
        key = f"uploads/{uuid.uuid4()}/{filename}"
        url = self.client.generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key, "ContentType": content_type},
            ExpiresIn=3600,
        )
        return {"url": url, "key": key}

    async def generate_presigned_download_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        if not self.client:
            return f"{settings.CDN_URL}/{settings.S3_BUCKET}/{key}"
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
        return url

    async def get_media_info(self, key: str) -> dict:
        if not self.client:
            return {"key": key, "url": f"{settings.CDN_URL}/{settings.S3_BUCKET}/{key}"}
        try:
            response = self.client.head_object(Bucket=settings.S3_BUCKET, Key=key)
            return {
                "key": key,
                "size": response.get("ContentLength", 0),
                "content_type": response.get("ContentType", ""),
                "etag": response.get("ETag", ""),
            }
        except Exception:
            return {"key": key, "size": 0, "content_type": ""}

    async def delete_media(self, key: str) -> bool:
        if not self.client:
            return True
        try:
            self.client.delete_object(Bucket=settings.S3_BUCKET, Key=key)
            return True
        except Exception:
            return False
