import logging
import traceback
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import SessionLocal, engine
from models import Base
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
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tabelas sincronizadas com sucesso no PostgreSQL!")
    except Exception as exc:
        logger.error("ERRO NA CRIAÇÃO DE TABELAS: %s\n%s", exc, traceback.format_exc())
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


@app.get("/diag/db")
def diag_db():
    """Diagnóstico temporário: devolve o erro real do DB em vez de 500."""
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as exc:
        return {"db": "error", "type": type(exc).__name__, "detail": str(exc)}