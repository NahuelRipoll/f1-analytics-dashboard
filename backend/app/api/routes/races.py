from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import jolpica

router = APIRouter(prefix="/races", tags=["races"])


@router.get("/schedule/{year}")
async def schedule(year: int, db: AsyncSession = Depends(get_db)):
    return await jolpica.get_schedule(db, year)


@router.get("/{year}/results")
async def season_results(year: int, db: AsyncSession = Depends(get_db)):
    return await jolpica.get_race_results(db, year)


@router.get("/{year}/{round}/results")
async def race_results(year: int, round: int, db: AsyncSession = Depends(get_db)):
    races = await jolpica.get_race_results(db, year, round)
    if not races:
        return {}
    race = races[0]
    qualifying = await jolpica.get_qualifying(db, year, round)
    race["qualifying"] = qualifying
    return race


@router.get("/{year}/{round}/qualifying")
async def qualifying(year: int, round: int, db: AsyncSession = Depends(get_db)):
    return await jolpica.get_qualifying(db, year, round)
