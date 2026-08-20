from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

import models
from database import engine
from routers import analytics, auth, workouts

# 1. INICIALIZAR A BASE DE DADOS
models.Base.metadata.create_all(bind=engine)

# 2. CRIAR A APLICAÇÃO FASTAPI
app = FastAPI(
    title="HydroLifts API",
    description="API para rastreamento híbrido de Ginásio e Natação",
)

# 3. CORS — permite que o frontend (Vercel, Netlify, localhost) chame a API
# Em produção define ALLOWED_ORIGINS=https://hydrolifts.vercel.app,https://hydrolifts.app
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. CONECTAR OS ROTEADORES
app.include_router(
    auth.router,
    tags=["Autenticação"]
)
app.include_router(
    workouts.router,
    tags=["Treinos"]
)
app.include_router(
    analytics.router,
    tags=["Analytics"]
)


@app.get("/")
def root():
    return {"mensagem": "Bem-vindo à HydroLifts API!"}
