import os
import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

dotenv.load_dotenv()  # Carrega as variáveis do ficheiro .env

# 1. Fallback garantido: caso DATABASE_URL não exista, usa SQLite por defeito
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./treinos.db")

# 2. Configuração condicional do motor dependendo da base de dados
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Para PostgreSQL (Supabase), remove o check_same_thread
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()