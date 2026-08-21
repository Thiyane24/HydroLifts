import os
import sys

import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

dotenv.load_dotenv()

DEFAULT_SQLITE_URL = "sqlite:///./treinos.db"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Sem DATABASE_URL — não podemos arrancar contra Postgres.
    # Em produção (Render/Koyeb/Railway) isto é sempre um erro de configuração;
    # em dev local sem Postgres configurado, aceitamos SQLite como fallback.
    if os.getenv("RENDER") or os.getenv("KOYEB") or os.getenv("RAILWAY_ENVIRONMENT"):
        sys.stderr.write(
            "ERRO: DATABASE_URL não está definida. Configura a env var no painel "
            "do serviço antes de fazer deploy.\n"
        )
        sys.exit(1)

    SQLALCHEMY_DATABASE_URL = DEFAULT_SQLITE_URL
    sys.stderr.write(
        "AVISO: DATABASE_URL não definida — a usar SQLite local "
        f"({DEFAULT_SQLITE_URL}). Os dados NÃO persistem entre redeploys.\n"
    )

# Força o driver psycopg v3 (compatível com o python:slim e Windows) quando
# o URL não traz um driver explícito.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql+psycopg://", 1
    )
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://") and "+psycopg" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg://", 1
    )

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Quando o URL aponta para o Supavisor (transaction pooler, porta 6543),
    # temos de marcar a ligação como compatível com PgBouncer: desactiva
    # prepared statements e impõe transacções curtas. Sem isto, o pooler
    # descarta comandos silenciosamente — INSERTs parecem funcionar mas
    # nunca persistem.
    if ":6543" in SQLALCHEMY_DATABASE_URL and "pgbouncer=true" not in SQLALCHEMY_DATABASE_URL:
        separator = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
        SQLALCHEMY_DATABASE_URL = f"{SQLALCHEMY_DATABASE_URL}{separator}pgbouncer=true"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
