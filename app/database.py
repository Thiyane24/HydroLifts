import os
import sys
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

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
    # psycopg3 + Supavisor (transaction pooler porta 6543):
    # O dialeto psycopg3 do SQLAlchemy NÃO suporta o kwarg `pgbouncer` — esse
    # nome é específico de psycopg2/asyncpg. Quando o SQLAlchemy o recebe em
    # connect_args, é passado a libpq e gera `invalid connection option
    # "pgbouncer"`. O mesmo se aplica a `statement_cache_size` /
    # `prepared_statement_cache_size` — também não existem em psycopg3.
    #
    # Para o Supavisor em transaction mode, basta usar a pooler URL correcta
    # (postgres.<ref>:<pw>@...pooler.supabase.com:6543) e o psycopg3 lida
    # com as transacções curtas sem settings extra.
    #
    # Por segurança, removemos `pgbouncer=true` da query string se alguém o
    # tiver colado manualmente — não serve para nada e faria a ligação falhar.
    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    query_params = parse_qs(parsed.query)
    query_params.pop("pgbouncer", None)
    query_params.pop("statement_cache_size", None)
    query_params.pop("prepared_statement_cache_size", None)

    if query_params:
        new_query = urlencode({k: v[0] for k, v in query_params.items()}, doseq=True)
        SQLALCHEMY_DATABASE_URL = urlunparse(parsed._replace(query=new_query))
    else:
        SQLALCHEMY_DATABASE_URL = urlunparse(parsed._replace(query=""))

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
