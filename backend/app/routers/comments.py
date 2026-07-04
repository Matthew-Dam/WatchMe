from typing import Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.comments import CommentCreate, CommentResponse, CommentUpdate, CommentList
from app.repositories.comment_repo import CommentRepository
from app.services.comment_service import CommentService
from app.deps.auth_deps import get_current_user, get_current_profile

router = APIRouter(prefix="/comments", tags=["Comments"])


def get_comment_service() -> CommentService:
    return CommentService(CommentRepository())


def _map_comment(c: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": c["id"],
        "title_id": c["title_id"],
        "user_id": c["profile_id"],
        "username": c["profile_name"],
        "avatar_url": c.get("avatar_url"),
        "parent_id": c.get("parent_id"),
        "content": c["text"],
        "is_spoiler": c.get("spoiler_tag", False),
        "video_timestamp": c.get("timestamp_seconds", 0.0),
        "likes_count": c.get("likes", 0),
        "is_liked": False,
        "replies": [_map_comment(r) for r in (c.get("replies") or [])],
        "created_at": c["created_at"] if isinstance(c["created_at"], datetime) else datetime.fromisoformat(c["created_at"]),
        "updated_at": datetime.fromisoformat(c["edited_at"]) if c.get("edited_at") else None,
    }


@router.get("/{title_id}", response_model=CommentList)
async def list_comments(
    title_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    max_timestamp: Optional[float] = Query(None),
    parent_id: Optional[str] = Query(None),
):
    service = get_comment_service()
    result = await service.get_comments(title_id, page, page_size, max_timestamp, parent_id)
    result["items"] = [_map_comment(item) for item in result["items"]]
    return result


@router.post("/{title_id}", response_model=CommentResponse, status_code=201)
async def create_comment(
    title_id: str,
    data: CommentCreate,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
):
    service = get_comment_service()
    comment = await service.create_comment(
        title_id, profile["id"], profile["name"],
        data.text, data.timestamp_seconds, data.parent_id, data.spoiler_tag,
    )
    return _map_comment(comment)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    data: CommentUpdate,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
):
    service = get_comment_service()
    comment = await service.update_comment(comment_id, profile["id"], data.text, data.spoiler_tag)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return _map_comment(comment)


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    profile_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_profile),
):
    service = get_comment_service()
    success = await service.delete_comment(comment_id, profile["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted"}


@router.post("/{comment_id}/like")
async def like_comment(comment_id: str):
    service = get_comment_service()
    result = await service.toggle_like(comment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"liked": True, "likes_count": result}


@router.get("/{title_id}/spoiler-free", response_model=CommentList)
async def spoiler_free_comments(
    title_id: str,
    position: float = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = get_comment_service()
    result = await service.get_spoiler_free_comments(title_id, position, page, page_size)
    result["items"] = [_map_comment(item) for item in result["items"]]
    return result
