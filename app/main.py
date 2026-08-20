from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
from models import Base
from routers import analytics, auth, workouts

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas só depois do server subir — assim o /healthz responde
    # imediatamente e o Render não marca o deploy como falhado enquanto o
    # Postgres conecta.
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # Não bloquear o startup: a app continua disponível e as rotas
        # vão falhar com 503 até a BD responder.
        pass
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
def health_check():
    return {"status": "ok", "message": "HydroLifts API is running!"}


@app.get("/")
def root():
    return {"mensagem": "Bem-vindo à HydroLifts API!"}


