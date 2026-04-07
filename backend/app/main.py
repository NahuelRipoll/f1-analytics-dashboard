from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.routes import standings, races, pitstops, analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="F1 Dashboard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(standings.router, prefix="/api")
app.include_router(races.router, prefix="/api")
app.include_router(pitstops.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "message": "F1 Dashboard API"}
