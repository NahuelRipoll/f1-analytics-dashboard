import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.services.cache import get_cached, set_cached

BASE = settings.openf1_base_url


async def _fetch(db: AsyncSession, endpoint: str, params: dict) -> list[dict]:
    cache_key = f"openf1:{endpoint}:{str(sorted(params.items()))}"
    cached = await get_cached(db, cache_key)
    if cached is not None:
        return cached
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(f"{BASE}/{endpoint}", params=params)
        resp.raise_for_status()
        data = resp.json()
    await set_cached(db, cache_key, data)
    return data


async def get_sessions(db: AsyncSession, year: int, session_type: str = "Race") -> list[dict]:
    return await _fetch(db, "sessions", {"year": year, "session_name": session_type})


async def get_race_session(db: AsyncSession, year: int, circuit_short_name: str) -> dict | None:
    sessions = await _fetch(db, "sessions", {"year": year, "circuit_short_name": circuit_short_name, "session_name": "Race"})
    return sessions[0] if sessions else None


async def get_pitstops(db: AsyncSession, session_key: int) -> list[dict]:
    return await _fetch(db, "pit", {"session_key": session_key})


async def get_stints(db: AsyncSession, session_key: int) -> list[dict]:
    return await _fetch(db, "stints", {"session_key": session_key})


async def get_laps(db: AsyncSession, session_key: int, driver_number: int | None = None) -> list[dict]:
    params: dict = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    return await _fetch(db, "laps", params)


async def get_drivers(db: AsyncSession, session_key: int) -> list[dict]:
    return await _fetch(db, "drivers", {"session_key": session_key})
