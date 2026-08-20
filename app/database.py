import os
import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

dotenv.load_dotenv()

# 1. Obtém a URL da BD
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./treinos.db")

# 2. Corrige o prefixo exigido pelo SQLAlchemy para PostgreSQL
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Configuração do Engine
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Para PostgreSQL (seja Render ou Supabase direto), esta é a forma limpa e segura:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,      # Descarta conexões mortas automaticamente
        pool_recycle=300,        # Recicla conexões a cada 5 min para evitar timeout do Render
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()