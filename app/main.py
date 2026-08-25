import logging
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analytics, auth, workouts

logger = logging.getLogger("uvicorn.error")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,https://hydrolifts.onrender.com,https://hydrolifts.vercel.app",
    ).split(",")
    if o.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # O schema é gerido pelo Alembic (alembic/versions). Não criamos
    # tabelas em runtime; em vez disso verificamos se a BD está em
    # sincronia com a head do repositório e avisamos se não estiver.
    try:
        from pathlib import Path

        from alembic.config import Config
        from alembic.runtime import migration
        from alembic.script import ScriptDirectory
        from sqlalchemy import text

        from database import engine as _engine

        root = Path(__file__).resolve().parent.parent
        cfg = Config(str(root / "alembic.ini"))
        cfg.set_main_option(
            "script_location", str(root / "alembic")
        )
        script_dir = ScriptDirectory.from_config(cfg)
        head = script_dir.get_current_head()

        with _engine.begin() as conn:
            # Garante a tabela alembic_version (idempotente).
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS alembic_version "
                "(version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
            ))
            current = conn.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            ).scalar()

        if current != head:
            logger.warning(
                "DB desactualizada: current=%s head=%s. "
                "Corre 'alembic upgrade head'.",
                current, head,
            )
        else:
            logger.info("Schema Alembic sincronizado (rev=%s).", current)
    except Exception as exc:
        logger.warning("Não foi possível verificar schema Alembic: %s", exc)
    yield


app = FastAPI(
    title="HydroLifts API",
    description="API para rastreamento híbrido de Ginásio e Natação",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Autenticação"])
app.include_router(workouts.router, tags=["Treinos"])
app.include_router(analytics.router, tags=["Analytics"])


@app.get("/")
def root():
    return {"mensagem": "Bem-vindo à HydroLifts API!"}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}