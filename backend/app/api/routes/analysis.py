from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import jolpica, analysis as svc

router = APIRouter(prefix="/analysis", tags=["analysis"])


async def _build_race_dataset(db: AsyncSession, years: list[int]) -> list[dict]:
    """Fetches race + pitstop data for multiple years and merges them."""
    races_data = []
    for year in years:
        schedule = await jolpica.get_schedule(db, year)
        for race in schedule:
            rnd = int(race["round"])
            try:
                results = await jolpica.get_race_results(db, year, rnd)
                pitstops = await jolpica.get_pitstops(db, year, rnd)
                qualifying = await jolpica.get_qualifying(db, year, rnd)
                if results:
                    race_entry = results[0].copy() if results else race.copy()
                    race_entry["pitstops"] = pitstops
                    race_entry["qualifying"] = qualifying
                    races_data.append(race_entry)
            except Exception:
                continue
    return races_data


@router.get("/pitstop-timing/{year}/{round}")
async def pitstop_timing(year: int, round: int, db: AsyncSession = Depends(get_db)):
    """Correlates pitstop timing (which lap) with final position for one race."""
    pitstops = await jolpica.get_pitstops(db, year, round)
    results_races = await jolpica.get_race_results(db, year, round)
    if not results_races:
        return {}
    results = results_races[0].get("Results", [])
    # Normalize driverId in results
    for r in results:
        r["driverId"] = r.get("Driver", {}).get("driverId", "")
    # Normalize driverId in pitstops
    for p in pitstops:
        if "driverId" not in p:
            p["driverId"] = p.get("Driver", {}).get("driverId", "")
    return svc.pitstop_timing_vs_position(pitstops, results)


@router.get("/stops-vs-position")
async def stops_vs_position(
    years: list[int] = Query(default=list(range(2018, 2025))),
    db: AsyncSession = Depends(get_db),
):
    """Average finishing position grouped by number of pitstops, across multiple years."""
    races_data = await _build_race_dataset(db, years)
    # Normalize keys
    for race in races_data:
        for r in race.get("Results", []):
            r["driverId"] = r.get("Driver", {}).get("driverId", "")
        race["results"] = race.get("Results", [])
        for p in race.get("pitstops", []):
            if "driverId" not in p:
                p["driverId"] = p.get("Driver", {}).get("driverId", "")
    return svc.stops_vs_position(races_data)


@router.get("/fastest-teams/{year}")
async def fastest_teams(year: int, db: AsyncSession = Depends(get_db)):
    """Ranks teams by average pitstop duration for a given year."""
    schedule = await jolpica.get_schedule(db, year)
    all_stops = []
    for race in schedule:
        rnd = int(race["round"])
        try:
            pitstops = await jolpica.get_pitstops(db, year, rnd)
            results_races = await jolpica.get_race_results(db, year, rnd)
            if results_races and pitstops:
                results = results_races[0].get("Results", [])
                driver_team = {
                    r.get("Driver", {}).get("driverId", ""): r.get("Constructor", {}).get("constructorId", "")
                    for r in results
                }
                for p in pitstops:
                    driver_id = p.get("driverId", "")
                    p["constructorId"] = driver_team.get(driver_id, "unknown")
                all_stops.extend(pitstops)
        except Exception:
            continue
    return svc.fastest_pitstop_teams(all_stops)


@router.get("/strategy-by-circuit")
async def strategy_by_circuit(
    years: list[int] = Query(default=list(range(2018, 2025))),
    db: AsyncSession = Depends(get_db),
):
    """Dominant pitstop strategy per circuit across selected years."""
    races_data = await _build_race_dataset(db, years)
    for race in races_data:
        for r in race.get("Results", []):
            r["driverId"] = r.get("Driver", {}).get("driverId", "")
        race["results"] = race.get("Results", [])
        for p in race.get("pitstops", []):
            if "driverId" not in p:
                p["driverId"] = p.get("Driver", {}).get("driverId", "")
    return svc.strategy_by_circuit(races_data)


@router.get("/predict-model")
async def train_and_predict(
    years: list[int] = Query(default=list(range(2018, 2024))),
    db: AsyncSession = Depends(get_db),
):
    """Trains the prediction model and returns feature importance + cross-val MAE."""
    races_data = await _build_race_dataset(db, years)
    for race in races_data:
        for r in race.get("Results", []):
            r["driverId"] = r.get("Driver", {}).get("driverId", "")
        race["results"] = race.get("Results", [])
        for p in race.get("pitstops", []):
            if "driverId" not in p:
                p["driverId"] = p.get("Driver", {}).get("driverId", "")
        for q in race.get("qualifying", []):
            q["driverId"] = q.get("Driver", {}).get("driverId", "")
    return svc.build_prediction_model(races_data)
