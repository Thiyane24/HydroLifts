import os
import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

dotenv.load_dotenv()  # Carrega as variáveis do ficheiro .env

# 1. Fallback garantido: caso DATABASE_URL não exista, usa SQLite por defeito
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./treinos.db")


def _build_postgres_engine(url: str):
    """Cria a engine para Postgres, garantindo compatibilidade com o Supavisor.

    Porquê isto existe:
    O Render liga ao Supabase via porta 6543 (transaction pooler / Supavisor).
    Esse pooler não suporta prepared statements e recicla sessões — sem o
    parâmetro `pgbouncer=true`, o SQLAlchemy envia comandos que o pooler
    descarta silenciosamente, e os INSERT parecem funcionar mas não persistem
    (parece "apagar contas a cada redeploy").

    Solução: acrescentamos `pgbouncer=true` ao URL e desactivamos o statement
    timeout (Supavisor impõe um timeout curto que corta queries longas).
    """
    if "pgbouncer=true" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}pgbouncer=true"

    return create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"options": "-c statement_timeout=0"},
    )


# 2. Configuração condicional do motor dependendo da base de dados
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = _build_postgres_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
