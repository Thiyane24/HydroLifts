import logging
from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
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
        logger.error("ERRO NA CRIAÇÃO DE TABELAS: %s", exc)
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