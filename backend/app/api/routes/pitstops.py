from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import jolpica, openf1

router = APIRouter(prefix="/pitstops", tags=["pitstops"])


@router.get("/{year}/{round}")
async def pitstops_for_race(year: int, round: int, db: AsyncSession = Depends(get_db)):
    """Returns Jolpica pitstop data for a specific race (all years)."""
    return await jolpica.get_pitstops(db, year, round)


@router.get("/openf1/{session_key}")
async def pitstops_openf1(session_key: int, db: AsyncSession = Depends(get_db)):
    """Returns detailed OpenF1 pitstop data (2023+) including duration."""
    return await openf1.get_pitstops(db, session_key)


@router.get("/stints/{session_key}")
async def stints(session_key: int, db: AsyncSession = Depends(get_db)):
    """Returns stint/tire data for a session (OpenF1, 2023+)."""
    return await openf1.get_stints(db, session_key)
