# F1 Analytics Dashboard

Full-stack Formula 1 analytics dashboard with historical data from 2015 to 2025.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Stack](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square)
![Stack](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square)

## Features

- **Driver & Constructor Standings** — season standings for any year from 2015 to 2025
- **Race Calendar** — full season calendar with results
- **Race Detail** — lap-by-lap breakdown, fastest laps, and results per race
- **Pitstop Analysis** — detailed pitstop data powered by the OpenF1 API (2023+)
- **Position Predictions** — ML model (Gradient Boosting) trained on historical data to predict race outcomes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, aiosqlite |
| Data sources | Jolpica/Ergast API, OpenF1 API |
| ML | scikit-learn, pandas |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Data fetching | React Query, Axios |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
pip install -r backend/requirements.txt

# Pre-warm the cache with historical data (recommended before first use)
python backend/ingest.py

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Windows scripts

Convenience `.bat` scripts are included at the project root:

```
start-backend.bat   # Starts the FastAPI server
start-frontend.bat  # Starts the Vite dev server
ingest.bat          # Runs the data ingestion script
```

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust as needed:

```env
DATABASE_URL=sqlite+aiosqlite:///./f1_cache.db
CACHE_TTL_HOURS=24
CORS_ORIGINS=http://localhost:5173
```

## Data Sources

- **[Jolpica/Ergast API](http://ergast.com/mrd/)** — historical F1 data from 1950 to present
- **[OpenF1 API](https://openf1.org/)** — detailed session data including pitstops and stints (2023+)

All responses are cached in a local SQLite database with a 24-hour TTL to minimize external API calls.
