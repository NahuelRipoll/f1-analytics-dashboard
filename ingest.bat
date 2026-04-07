@echo off
cd /d "%~dp0backend"
if not exist ".env" copy ".env.example" ".env"
echo.
echo ============================================================
echo  F1 Dashboard - Ingesta de datos (2015-2025)
echo  Esto puede tardar 20-40 minutos la primera vez.
echo  Los datos quedan cacheados en f1_cache.db
echo ============================================================
echo.
python ingest.py %*
pause
