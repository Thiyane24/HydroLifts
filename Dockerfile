FROM python:3.11-slim

WORKDIR /code

# `app/` no PYTHONPATH mantém o estilo de imports actual (from database
# import Base, from models import ...). Alembic lê `alembic.ini` por
# caminho relativo, por isso corre a partir de /code.
ENV PYTHONPATH=/code/app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# Copiar a app e a pasta de migrações Alembic para /code.
COPY ./app /code/app
COPY ./alembic /code/alembic
COPY ./alembic.ini /code/alembic.ini

EXPOSE 8000

# Correr do /code para que o alembic.ini e a pasta alembic/ sejam
# encontrados pelo env.py do Alembic.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}