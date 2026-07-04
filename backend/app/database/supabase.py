from typing import Optional
from httpx import AsyncClient, HTTPError
from app.config import settings


class SupabaseClient:
    def __init__(self):
        self.client: Optional[AsyncClient] = None
        self.url = settings.SUPABASE_URL
        self.anon_key = settings.SUPABASE_ANON_KEY
        self.service_key = settings.SUPABASE_SERVICE_KEY

    async def connect(self):
        self.client = AsyncClient(
            base_url=self.url,
            headers={"apikey": self.anon_key},
            timeout=30,
        )

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None

    def _use_key(self, use_service_role: bool = False) -> str:
        return self.service_key if (use_service_role and self.service_key) else self.anon_key

    def _headers(self, key: str) -> dict:
        return {"apikey": key, "Authorization": f"Bearer {key}"}

    def _build_params(self, columns: str = "*", filters: Optional[dict] = None, order: Optional[str] = None, limit: int = 100, offset: int = 0) -> dict:
        params = {"select": columns, "limit": str(limit), "offset": str(offset)}
        if order:
            params["order"] = order
        if filters:
            for k, v in filters.items():
                params[k] = v
        return params

    async def select(
        self, table: str, columns: str = "*",
        filters: Optional[dict] = None,
        order: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        use_service_role: bool = False,
    ) -> tuple[list[dict], int]:
        if not self.client:
            raise RuntimeError("Supabase not connected")
        key = self._use_key(use_service_role)
        params = self._build_params(columns, filters, order, limit, offset)
        headers = self._headers(key)
        headers["Prefer"] = "count=exact"
        resp = await self.client.get(f"/rest/v1/{table}", params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        if "content-range" in resp.headers:
            count_str = resp.headers["content-range"].split("/")[-1]
            try:
                count = int(count_str)
            except (ValueError, IndexError):
                count = len(data)
        else:
            count = len(data)
        return data, count

    async def select_one(
        self, table: str, id_value: str,
        id_column: str = "id",
        use_service_role: bool = False,
    ) -> Optional[dict]:
        if not self.client:
            raise RuntimeError("Supabase not connected")
        key = self._use_key(use_service_role)
        filters = {id_column: f"eq.{id_value}"}
        params = self._build_params("*", filters, limit=1)
        resp = await self.client.get(f"/rest/v1/{table}", params=params, headers=self._headers(key))
        if resp.status_code == 404:
            return None
        try:
            resp.raise_for_status()
        except HTTPError:
            raise
        data = resp.json()
        return data[0] if data else None

    async def insert(
        self, table: str, data: dict,
        use_service_role: bool = False,
    ) -> Optional[dict]:
        if not self.client:
            raise RuntimeError("Supabase not connected")
        key = self._use_key(use_service_role)
        headers = {
            **self._headers(key),
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        resp = await self.client.post(f"/rest/v1/{table}", json=data, headers=headers)
        if resp.status_code == 401:
            raise PermissionError(f"API key lacks write access to {table}")
        if resp.status_code >= 400:
            try:
                body = resp.json()
            except Exception:
                body = resp.text
            raise RuntimeError(f"Supabase {table} insert failed (HTTP {resp.status_code}): {body}")
        resp.raise_for_status()
        result = resp.json()
        return result[0] if isinstance(result, list) and result else result

    async def update(
        self, table: str, id_value: str,
        data: dict, id_column: str = "id",
        use_service_role: bool = False,
    ) -> bool:
        if not self.client:
            raise RuntimeError("Supabase not connected")
        key = self._use_key(use_service_role)
        headers = {
            **self._headers(key),
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        filters = {id_column: f"eq.{id_value}"}
        resp = await self.client.patch(f"/rest/v1/{table}", params=filters, json=data, headers=headers)
        if resp.status_code == 401:
            raise PermissionError(f"API key lacks write access to {table}")
        resp.raise_for_status()
        return True

    async def delete(
        self, table: str, id_value: str,
        id_column: str = "id",
        use_service_role: bool = False,
    ) -> bool:
        if not self.client:
            raise RuntimeError("Supabase not connected")
        key = self._use_key(use_service_role)
        filters = {id_column: f"eq.{id_value}"}
        resp = await self.client.delete(f"/rest/v1/{table}", params=filters, headers=self._headers(key))
        if resp.status_code == 401:
            raise PermissionError(f"API key lacks write access to {table}")
        resp.raise_for_status()
        return True

    async def filter_in(
        self, table: str, column: str,
        values: list,
        columns: str = "*",
        use_service_role: bool = False,
    ) -> list[dict]:
        if not self.client or not values:
            return []
        key = self._use_key(use_service_role)
        or_filters = ",".join(f"{column}.eq.{v}" for v in values)
        params = {"select": columns, "or": f"({or_filters})"}
        resp = await self.client.get(f"/rest/v1/{table}", params=params, headers=self._headers(key))
        resp.raise_for_status()
        return resp.json()


supabase = SupabaseClient()
