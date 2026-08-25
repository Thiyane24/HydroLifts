"""Alembic environment.

Configurado para usar:
- a `DATABASE_URL` (psycopg3) que `app.database` já prepara;
- o `Base` do `app.database` para autogenerate;
- os modelos em `app.models` (registados no `Base.metadata`).

Nota: `app/models.py` usa `from database import Base` (import não-relativo),
que só resolve quando `app/` está no `sys.path` e o `models` é importado
**dentro do package `app`**. Adicionamos `app/` ao path e forçamos o
re-registro do módulo `models` como `app.models` para garantir que o
`Base` partilhado é o mesmo que o `app.database.Base`.
"""
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# Procurar a raiz do projecto (onde está `app/`). Tenta vários candidatos
# para suportar dev local e Docker (/code).
PROJECT_ROOTS = [
    Path("/code"),  # Render/Docker
    Path(__file__).resolve().parent.parent,  # dev: alembic/ está aqui
    Path.cwd(),
]
PROJECT_ROOT = next(
    (p for p in PROJECT_ROOTS if (p / "app").is_dir()), PROJECT_ROOTS[1]
)
APP_DIR = PROJECT_ROOT / "app"

# Carregamento como pacote: o pai de `app` tem de estar no path para que
# `import app.models` resolva o `models.py` de dentro do package.
sys.path.insert(0, str(PROJECT_ROOT))
# `app/` no path mantém compatibilidade com o import não-relativo
# `from database import Base` que está em `app/models.py`.
sys.path.insert(0, str(APP_DIR))

# Importar o package (não o módulo solto) garante que o Python usa
# o `Base` que `app.database` definiu, em vez de criar uma 2ª instância
# via `declarative_base()` dentro de `models.py`.
import app.database  # noqa: E402
from app import models as _models  # noqa: E402, F401 — regista tabelas no Base.metadata

Base = app.database.Base

config = context.config

# Lê a DATABASE_URL do ambiente (igual ao que `app.database` faz). Se não
# estiver definida, recorremos ao valor no alembic.ini (útil para SQLite
# local de testes).
db_url = os.getenv("DATABASE_URL")
if db_url:
    # Reaplica as mesmas normalizações que `app.database` faz, para que
    # o Alembic use a mesma string que a app (psycopg3 driver).
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and "+psycopg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Garante que o `script_location` do `alembic.ini` aponta para a pasta
# `alembic/` que acabámos de descobrir (evita paths relativos errados
# quando o CLI é invocado de outro cwd).
config.set_main_option("script_location", str(PROJECT_ROOT / "alembic"))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
