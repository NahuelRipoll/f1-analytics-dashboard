import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.services.cache import get_cached, set_cached

BASE = settings.jolpica_base_url


async def _fetch(db: AsyncSession, url: str, params: dict | None = None) -> dict:
    cache_key = url + str(sorted((params or {}).items()))
    cached = await get_cached(db, cache_key)
    if cached is not None:
        return cached
    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(4):
            resp = await client.get(url, params=params)
            if resp.status_code == 429:
                wait = 2 ** attempt * 5  # 5s, 10s, 20s, 40s
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            await set_cached(db, cache_key, data)
            return data
    resp.raise_for_status()  # lanza el último error si agotó reintentos


async def get_driver_standings(db: AsyncSession, year: int, round: int | None = None) -> list[dict]:
    path = f"{BASE}/{year}/driverStandings.json"
    if round:
        path = f"{BASE}/{year}/{round}/driverStandings.json"
    data = await _fetch(db, path, {"limit": 100})
    lists = data["MRData"]["StandingsTable"]["StandingsLists"]
    if not lists:
        return []
    return lists[0]["DriverStandings"]


async def get_constructor_standings(db: AsyncSession, year: int, round: int | None = None) -> list[dict]:
    path = f"{BASE}/{year}/constructorStandings.json"
    if round:
        path = f"{BASE}/{year}/{round}/constructorStandings.json"
    data = await _fetch(db, path, {"limit": 100})
    lists = data["MRData"]["StandingsTable"]["StandingsLists"]
    if not lists:
        return []
    return lists[0]["ConstructorStandings"]


async def get_race_results(db: AsyncSession, year: int, round: int | None = None) -> list[dict]:
    path = f"{BASE}/{year}/results.json"
    if round:
        path = f"{BASE}/{year}/{round}/results.json"
    data = await _fetch(db, path, {"limit": 100})
    return data["MRData"]["RaceTable"]["Races"]


async def get_schedule(db: AsyncSession, year: int) -> list[dict]:
    data = await _fetch(db, f"{BASE}/{year}.json", {"limit": 100})
    return data["MRData"]["RaceTable"]["Races"]


async def get_qualifying(db: AsyncSession, year: int, round: int) -> list[dict]:
    data = await _fetch(db, f"{BASE}/{year}/{round}/qualifying.json", {"limit": 100})
    races = data["MRData"]["RaceTable"]["Races"]
    if not races:
        return []
    return races[0].get("QualifyingResults", [])


async def get_pitstops(db: AsyncSession, year: int, round: int) -> list[dict]:
    data = await _fetch(db, f"{BASE}/{year}/{round}/pitstops.json", {"limit": 200})
    races = data["MRData"]["RaceTable"]["Races"]
    if not races:
        return []
    return races[0].get("PitStops", [])


async def get_standings_history(db: AsyncSession, year: int) -> list[dict]:
    """Returns driver standings after each round of the season."""
    schedule = await get_schedule(db, year)
    history = []
    for race in schedule:
        rnd = int(race["round"])
        standings = await get_driver_standings(db, year, rnd)
        history.append({"round": rnd, "raceName": race["raceName"], "standings": standings})
    return history
