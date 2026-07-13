# Trekking Management Application Backend

FastAPI async backend for TMA V2.

## Run locally

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

PostgreSQL and Redis must be running and match `.env`.
