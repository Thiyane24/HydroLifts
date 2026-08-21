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
    # Quando o URL aponta para o Supavisor (transaction pooler, porta 6543)
    # temos de desactivar prepared statements e o statement cache do psycopg3,
    # senão o pooler devolve erros. SQLAlchemy espera `pgbouncer` em
    # connect_args, NÃO na query string do URL (libpq não reconhece a opção).
    # Migramos qualquer `pgbouncer=true` colado no URL para connect_args.
    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    query_params = parse_qs(parsed.query)
    connect_args = {}

    if query_params.pop("pgbouncer", None):
        connect_args["pgbouncer"] = True

    using_pooler = (
        ":6543" in SQLALCHEMY_DATABASE_URL
        or "pooler.supabase.com" in SQLALCHEMY_DATABASE_URL
        or connect_args.get("pgbouncer") is True
    )
    if using_pooler:
        # psycopg3 cacheia prepared statements por defeito; Supavisor
        # (transaction mode) não os suporta. statement_cache_size=0
        # resolve "prepared statement does not exist" em reconnect.
        connect_args.setdefault("statement_cache_size", 0)
        connect_args.setdefault("prepared_statement_cache_size", 0)
        connect_args.setdefault("pgbouncer", True)

    if query_params:
        # Reencoda a query string sem o(s) param(s) que migrámos.
        new_query = urlencode({k: v[0] for k, v in query_params.items()}, doseq=True)
        SQLALCHEMY_DATABASE_URL = urlunparse(parsed._replace(query=new_query))

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,
        connect_args=connect_args or None,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
