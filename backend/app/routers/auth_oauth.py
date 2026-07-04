import uuid
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from httpx import AsyncClient
from app.config import settings
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService
from app.deps.db_deps import get_db_session

router = APIRouter(prefix="/auth", tags=["Auth"])

class OAuthCallbackRequest(BaseModel):
    code: str
    provider: str


def _oauth_base_url(request: Optional[Request] = None) -> str:
    if settings.OAUTH_REDIRECT_BASE_URL:
        return settings.OAUTH_REDIRECT_BASE_URL
    if request:
        origin = request.headers.get("origin", "")
        if origin and "://" in origin:
            return origin.rstrip("/")
        referer = request.headers.get("referer", "")
        if referer and "://" in referer:
            return referer.rstrip("/").split("?")[0].split("#")[0]
    return "http://localhost:5173"


@router.get("/oauth/{provider}/login")
async def oauth_login(provider: str, request: Request):
    base_url = _oauth_base_url(request)
    google_redirect = f"{base_url}/auth/google/callback"
    github_redirect = f"{base_url}/auth/github/callback"
    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=501, detail="Google OAuth not configured")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": google_redirect,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
        }
        query = urllib.parse.urlencode(params)
        return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}"}
    elif provider == "github":
        if not settings.GITHUB_CLIENT_ID:
            raise HTTPException(status_code=501, detail="GitHub OAuth not configured")
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": github_redirect,
            "scope": "user:email",
        }
        query = urllib.parse.urlencode(params)
        return {"url": f"https://github.com/login/oauth/authorize?{query}"}
    raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


@router.post("/oauth/callback")
async def oauth_callback(
    req: OAuthCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    provider = req.provider
    code = req.code

    base_url = _oauth_base_url(request)
    google_redirect = f"{base_url}/auth/google/callback"
    github_redirect = f"{base_url}/auth/github/callback"

    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=501, detail="Google OAuth not configured")
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": google_redirect,
            "grant_type": "authorization_code",
        }
        async with AsyncClient() as client:
            resp = await client.post(token_url, data=data)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange Google code")
            tokens = resp.json()
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get Google user info")
            userinfo = userinfo_resp.json()

        email = userinfo.get("email", "")
        display_name = userinfo.get("name", email.split("@")[0])
        google_id = userinfo.get("id", "")

    elif provider == "github":
        if not settings.GITHUB_CLIENT_ID:
            raise HTTPException(status_code=501, detail="GitHub OAuth not configured")
        token_url = "https://github.com/login/oauth/access_token"
        data = {
            "code": code,
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "redirect_uri": github_redirect,
        }
        headers = {"Accept": "application/json"}
        async with AsyncClient() as client:
            resp = await client.post(token_url, data=data, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange GitHub code")
            tokens = resp.json()
            userinfo_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get GitHub user info")
            userinfo = userinfo_resp.json()
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            emails = emails_resp.json()
            primary_email = next((e["email"] for e in emails if e.get("primary")), "")

        email = primary_email or f"github_{userinfo.get('id', '')}@github.user"
        display_name = userinfo.get("name") or userinfo.get("login", "GitHub User")
        google_id = ""
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from provider")

    repo = UserRepository(db)
    auth_service = AuthService(repo)

    existing = await repo.get_user_by_email(email)
    if existing:
        user_id = existing.id
    else:
        password_hash = auth_service.hash_password(str(uuid.uuid4()))
        user = await repo.create_user(email, password_hash, display_name)
        user_id = user.id
        if display_name:
            await repo.update_user(user_id, display_name=display_name)

    access_token = auth_service.create_access_token(user_id)
    refresh_token = auth_service.create_refresh_token(user_id)
    from datetime import datetime, timedelta, timezone
    session_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await repo.create_session(user_id, refresh_token, provider, None, session_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
