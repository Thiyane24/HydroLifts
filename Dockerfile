FROM python:3.11-slim

WORKDIR /code

ENV PYTHONPATH=/code/app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

COPY ./app /code/app

EXPOSE 8000

# Troca a sintaxe de lista [ ] por string direta para interpretar o $PORT:
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}