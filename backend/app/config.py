import json
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./f1_cache.db"
    jolpica_base_url: str = "https://api.jolpi.ca/ergast/f1"
    openf1_base_url: str = "https://api.openf1.org/v1"
    cache_ttl_hours: int = 24
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [o.strip() for o in v.split(",")]
        return v

    model_config = {"env_file": ".env"}


settings = Settings()
