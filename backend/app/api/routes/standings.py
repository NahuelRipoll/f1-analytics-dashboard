from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import jolpica

router = APIRouter(prefix="/standings", tags=["standings"])


@router.get("/drivers/{year}")
async def driver_standings(year: int, round: int | None = None, db: AsyncSession = Depends(get_db)):
    return await jolpica.get_driver_standings(db, year, round)


@router.get("/constructors/{year}")
async def constructor_standings(year: int, round: int | None = None, db: AsyncSession = Depends(get_db)):
    return await jolpica.get_constructor_standings(db, year, round)


@router.get("/drivers/{year}/history")
async def driver_standings_history(year: int, db: AsyncSession = Depends(get_db)):
    """Returns standings after every round — used for championship evolution chart."""
    return await jolpica.get_standings_history(db, year)
