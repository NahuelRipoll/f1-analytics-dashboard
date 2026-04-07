import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.cache import CacheEntry
from app.config import settings


async def get_cached(db: AsyncSession, key: str) -> dict | list | None:
    result = await db.execute(select(CacheEntry).where(CacheEntry.key == key))
    entry = result.scalar_one_or_none()
    if entry is None:
        return None
    age = datetime.utcnow() - entry.created_at
    if age > timedelta(hours=settings.cache_ttl_hours):
        await db.execute(delete(CacheEntry).where(CacheEntry.key == key))
        await db.commit()
        return None
    return json.loads(entry.data)


async def set_cached(db: AsyncSession, key: str, data: dict | list) -> None:
    await db.execute(delete(CacheEntry).where(CacheEntry.key == key))
    entry = CacheEntry(key=key, data=json.dumps(data))
    db.add(entry)
    await db.commit()
