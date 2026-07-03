from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.services.media_service import MediaService
from app.deps.auth_deps import require_admin

router = APIRouter(prefix="/upload", tags=["Upload"])


class PresignedUploadRequest(BaseModel):
    filename: str
    content_type: str


class UploadNotify(BaseModel):
    key: str
    title_id: str


@router.post("/presigned")
async def get_presigned_url(req: PresignedUploadRequest, admin: dict = Depends(require_admin)):
    service = MediaService()
    return await service.generate_presigned_upload_url(req.filename, req.content_type)


@router.post("/notify")
async def upload_notify(req: UploadNotify, background_tasks: BackgroundTasks):
    from app.tasks.media_tasks import transcode_video, sync_to_meilisearch
    background_tasks.add_task(transcode_video, req.key, req.title_id)
    background_tasks.add_task(sync_to_meilisearch, req.title_id)
    return {"message": "Transcode started", "title_id": req.title_id}


@router.get("/status/{task_id}")
async def check_status(task_id: str):
    from celery.result import AsyncResult
    from app.tasks.media_tasks import celery_app
    result = AsyncResult(task_id, app=celery_app)
    return {"task_id": task_id, "status": result.status, "result": result.result}
