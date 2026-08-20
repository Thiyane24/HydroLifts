FROM python:3.11-slim

WORKDIR /code

# Define a pasta /code/app como diretoria de busca de módulos do Python
ENV PYTHONPATH=/code/app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

COPY ./app /code/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]