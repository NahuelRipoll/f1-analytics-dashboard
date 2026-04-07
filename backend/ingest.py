"""
Script de ingesta de datos F1.

Uso:
    python ingest.py                    # Carga todas las temporadas (2015-2025)
    python ingest.py --years 2023 2024  # Solo esas temporadas
    python ingest.py --years 2025 --force  # Re-descarga aunque ya esté cacheado

El script descarga y cachea en SQLite:
  - Calendario de cada temporada
  - Resultados de carrera
  - Clasificación (qualifying)
  - Pitstops
  - Standings de pilotos y constructores (por ronda, para gráfico de evolución)
"""

import asyncio
import argparse
import sys
from datetime import datetime

import httpx
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Ajustamos el path para importar desde app/
sys.path.insert(0, ".")

from app.config import settings
from app.database import init_db
from app.services.cache import get_cached, set_cached
from app.services import jolpica

YEARS = list(range(2015, 2026))
DELAY = 1.0  # segundos entre requests para no saturar la API


async def fetch_race(db, year: int, round_num: int, race_name: str) -> dict:
    """Descarga todos los datos de una carrera específica."""
    results = {"pitstops": 0, "qualifying": 0, "results": 0}

    # Resultados
    try:
        races = await jolpica.get_race_results(db, year, round_num)
        if races:
            results["results"] = len(races[0].get("Results", []))
    except Exception as e:
        print(f"      ✗ Resultados: {e}")
    await asyncio.sleep(DELAY)

    # Qualifying
    try:
        qual = await jolpica.get_qualifying(db, year, round_num)
        results["qualifying"] = len(qual)
    except Exception as e:
        print(f"      ✗ Qualifying: {e}")
    await asyncio.sleep(DELAY)

    # Pitstops
    try:
        pits = await jolpica.get_pitstops(db, year, round_num)
        results["pitstops"] = len(pits)
    except Exception as e:
        print(f"      ✗ Pitstops: {e}")
    await asyncio.sleep(DELAY)

    return results


async def fetch_season(db, year: int):
    print(f"\n{'='*60}")
    print(f"  Temporada {year}")
    print(f"{'='*60}")

    # Calendario
    print(f"  Descargando calendario...")
    try:
        schedule = await jolpica.get_schedule(db, year)
        print(f"  ✓ {len(schedule)} carreras encontradas")
    except Exception as e:
        print(f"  ✗ Error obteniendo calendario: {e}")
        return
    await asyncio.sleep(DELAY)

    # Standings finales de temporada
    print(f"  Descargando standings finales...")
    try:
        drivers = await jolpica.get_driver_standings(db, year)
        constructors = await jolpica.get_constructor_standings(db, year)
        print(f"  ✓ {len(drivers)} pilotos, {len(constructors)} equipos")
    except Exception as e:
        print(f"  ✗ Standings: {e}")
    await asyncio.sleep(DELAY)

    # Para temporadas completadas, descargamos standings por ronda (evolución)
    today = datetime.now().date()
    completed_races = [r for r in schedule if datetime.strptime(r["date"], "%Y-%m-%d").date() < today]

    if completed_races:
        print(f"  Descargando standings por ronda ({len(completed_races)} rondas)...")
        for i, race in enumerate(completed_races):
            rnd = int(race["round"])
            try:
                await jolpica.get_driver_standings(db, year, rnd)
                await asyncio.sleep(DELAY)
            except Exception:
                pass
            # Progress
            if (i + 1) % 5 == 0 or (i + 1) == len(completed_races):
                print(f"    Ronda {rnd}/{len(completed_races)} ✓")

    # Datos por carrera
    print(f"\n  Descargando datos de carreras ({len(completed_races)} completadas)...")
    total_pits = 0
    for race in completed_races:
        rnd = int(race["round"])
        name = race["raceName"]
        print(f"    Ronda {rnd:2d} · {name[:40]:<40}", end=" ", flush=True)
        r = await fetch_race(db, year, rnd, name)
        total_pits += r["pitstops"]
        print(f"✓  res:{r['results']:2d}  qual:{r['qualifying']:2d}  pits:{r['pitstops']:3d}")

    print(f"\n  Temporada {year} completada — {total_pits} pitstops totales")


async def main(years: list[int], force: bool):
    print("\nF1 Dashboard — Ingesta de datos")
    print(f"Temporadas: {years}")
    print(f"Modo: {'forzar re-descarga' if force else 'usar caché existente'}")
    print()

    # Inicializar DB
    engine = create_async_engine(settings.database_url, echo=False)
    AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        from app.models.cache import CacheEntry  # noqa
        from app.database import Base
        await conn.run_sync(Base.metadata.create_all)

    if force:
        print("⚠  Modo force: limpiando caché existente...")
        async with AsyncSession() as db:
            from sqlalchemy import delete
            from app.models.cache import CacheEntry
            await db.execute(delete(CacheEntry))
            await db.commit()
        print("   Caché limpiada.\n")

    start = datetime.now()

    for year in years:
        async with AsyncSession() as db:
            await fetch_season(db, year)

    elapsed = (datetime.now() - start).total_seconds()
    mins = int(elapsed // 60)
    secs = int(elapsed % 60)
    print(f"\n{'='*60}")
    print(f"  Ingesta completada en {mins}m {secs}s")
    print(f"  Base de datos: f1_cache.db")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingesta de datos F1")
    parser.add_argument(
        "--years", nargs="+", type=int,
        default=YEARS,
        help="Temporadas a cargar (ej: --years 2023 2024)"
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Re-descargar aunque ya estén en caché"
    )
    args = parser.parse_args()
    asyncio.run(main(args.years, args.force))
