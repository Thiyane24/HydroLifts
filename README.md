<div align="center">

# HydroLifts

**Track hybrid training — gym and swimming — in one dashboard.**

A full-stack monorepo: a FastAPI + PostgreSQL backend with JWT auth, and a React + TypeScript single-page app styled with TailwindCSS. Designed mobile-first with the *Pool Palette* (cyan, navy, mint).

[Features](#-features) · [Architecture](#-architecture) · [Quickstart](#-quickstart) · [Environment](#-environment-variables) · [Deployment](#-deployment) · [API](#-api-reference) · [License](#-license)

</div>

---

## ✨ Features

- **Hybrid training log** — record gym sets (name + sets + reps) and swim sets (distance + reps) on the same workout.
- **Weekly summary** — totals (workouts, gym sets/reps, swim meters) and a *running-equivalent* in km (`1 km swim ≈ 4 km run`).
- **Full CRUD on workouts** — create, list, edit (`PUT`) and delete (`DELETE`) from the dashboard.
- **JWT auth** — `OAuth2PasswordRequestForm` login + bcrypt password hashing via `pwdlib`.
- **Mobile-first UI** — bottom tab bar, 44×44 px touch targets, segmented toggle (gym vs swim), inline validation.
- **Accessible** — semantic roles, `aria-*` labels, WCAG AA contrast, ESC-to-close on modals.
- **Live feedback** — every async action surfaces a success or error toast.

---

## 🧱 Tech stack

| Layer        | Technology                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Frontend     | React 18 · Vite 5 · TypeScript 5 · TailwindCSS 3 · `lucide-react` · `axios` · `react-router-dom` · `react-hot-toast` |
| Backend      | FastAPI 0.115 · SQLAlchemy 2 · Pydantic 2 · `pwdlib` (bcrypt) · PyJWT                             |
| Persistence  | PostgreSQL 16 (production) · SQLite (local fallback only)                                         |
| Deployment   | Vercel (frontend) · Koyeb / Railway / Render (backend)                                            |

---

## 📁 Project structure

```
HydroLifts/
├── app/                         # FastAPI backend
│   ├── main.py                  # entrypoint · CORS · lifespan
│   ├── database.py              # engine + SessionLocal
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic DTOs (Create / Update / Response)
│   ├── security.py              # bcrypt hashing + JWT helpers
│   └── routers/
│       ├── auth.py              # /auth/register · /auth/login
│       ├── workouts.py          # /workouts CRUD
│       └── analytics.py         # /analytics/weekly-summary
│
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── pages/               # AuthView · DashboardView · LogWorkoutView
│   │   ├── components/          # Layout · WorkoutForm · ConfirmDialog · EditWorkoutModal
│   │   ├── contexts/            # AuthContext (token + user)
│   │   └── lib/api.ts           # axios client + interceptors
│   ├── vercel.json              # build settings
│   └── vite.config.ts           # dev proxy /api → :8000
│
├── Dockerfile                   # backend image (python:3.11-slim)
├── render.yaml                  # Render blueprint
├── railway.toml                 # Railway detection
├── vercel.json                  # frontend rootDirectory
├── package.json                 # monorepo marker (keeps Vercel out of the root)
└── requirements.txt             # pinned backend dependencies
```

---

## 🚀 Quickstart

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 14+ (or skip and use the SQLite fallback for local-only work)

### 1. Backend

```bash
# from the repo root
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# minimal environment for local dev
export Secret_Key=$(python -c "import secrets; print(secrets.token_hex(32))")
export Hashing_Algorithm=HS256
export ACCESS_TOKEN_EXPIRE_MINUTES=60
# optional — without it, the backend uses a local SQLite file
# export DATABASE_URL=postgresql://user:pass@localhost:5432/hydrolifts

uvicorn app.main:app --reload --port 8000
```

Useful URLs:

| URL                            | Purpose                |
| ------------------------------ | ---------------------- |
| `http://localhost:8000/`        | Welcome payload        |
| `http://localhost:8000/healthz` | Liveness probe         |
| `http://localhost:8000/docs`    | Swagger UI             |
| `http://localhost:8000/redoc`   | ReDoc                  |

### 2. Frontend

```bash
cd frontend
npm install

# point at the local backend
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
# open http://localhost:5173
```

In dev mode the SPA talks directly to `VITE_API_URL`. The `/api` proxy in `vite.config.ts` is kept as an escape hatch for setups that prefer a relative path.

---

## 🔐 Environment variables

### Backend

| Key                          | Required | Description                                              |
| ---------------------------- | -------- | -------------------------------------------------------- |
| `Secret_Key`                 | ✅       | HMAC secret for JWT. Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `Hashing_Algorithm`          | ✅       | JWT algorithm. Use `HS256`.                              |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| ✅       | Token TTL in minutes (e.g. `60`).                        |
| `DATABASE_URL`               | ⚠️       | PostgreSQL connection string. If unset, falls back to a **local, non-persistent SQLite file** — fine for dev, **never** for production. |
| `ALLOWED_ORIGINS`            | ✅       | Comma-separated list of origins allowed by CORS. Must include the deployed Vercel URL. |

### Frontend

| Key             | Required | Description                                                  |
| --------------- | -------- | ------------------------------------------------------------ |
| `VITE_API_URL`  | ✅       | Public URL of the backend, **without** trailing slash or `/api` suffix. Example: `https://api.hydrolifts.app`. |

---

## ☁️ Deployment

### Frontend → Vercel

`vercel.json` at the repo root sets `rootDirectory: frontend`, so Vercel builds the SPA automatically.

1. **Add New Project → Import** `Thiyane24/HydroLifts`.
2. Framework preset: **Vite** (auto-detected).
3. Add environment variable: `VITE_API_URL` = public backend URL.
4. Deploy. Every push to `main` triggers a new build.

### Backend → Koyeb (recommended, free tier)

1. **Create Database** → PostgreSQL, free plan. Copy the connection string (includes `?sslmode=require`).
2. **Create Service** → Docker → repo `Thiyane24/HydroLifts` → branch `main`.
3. Instance: **Free**, port `8000`.
4. Environment variables:
   - `Secret_Key` → **Generate**
   - `Hashing_Algorithm` → `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` → `60`
   - `DATABASE_URL` → the connection string from step 1
   - `ALLOWED_ORIGINS` → the Vercel URL once you have it
5. Deploy. Note the public domain (`*.koyeb.app`).

### Backend → Railway

`railway.toml` + `Dockerfile` are detected automatically.

1. **New Project → Deploy from GitHub** → `Thiyane24/HydroLifts`.
2. Add the **Postgres** plugin — Railway injects `DATABASE_URL` automatically.
3. Add the remaining variables (`Secret_Key`, `Hashing_Algorithm`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALLOWED_ORIGINS`).
4. **Settings → Networking → Generate Domain**.

### Backend → Render (legacy / fallback)

`render.yaml` is a Render Blueprint that ties the web service to the database. Free tier hibernates after 15 minutes; the first request after idle takes ~30 s. **Use at least the Starter plan for any non-toy usage.**

> Render's free Postgres expires after 30 days. Migrate to Railway or a paid Render plan for anything serious.

---

## 📡 API reference

All `/workouts/*` and `/analytics/*` endpoints require a `Bearer` token in the `Authorization` header.

| Method | Endpoint                          | Auth | Body                                                                                                          | Returns                              |
| ------ | --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/`                               | —    | —                                                                                                             | Welcome message                      |
| GET    | `/healthz`                        | —    | —                                                                                                             | `{ "status": "ok" }`                 |
| POST   | `/auth/register`                  | —    | `{ "email": string, "password": string }`                                                                     | `UserResponse`                       |
| POST   | `/auth/login`                     | —    | `application/x-www-form-urlencoded` — `username` (email), `password`                                          | `{ "access_token", "token_type" }`   |
| POST   | `/workouts`                       | ✅   | `{ workout_date, workout_type, exercicios_ginasio?[], series_natacao?[] }`                                    | `WorkoutResponse`                    |
| GET    | `/workouts`                       | ✅   | —                                                                                                             | `WorkoutResponse[]`                  |
| GET    | `/workouts/{id}`                  | ✅   | —                                                                                                             | `WorkoutResponse`                    |
| PUT    | `/workouts/{id}`                  | ✅   | `{ workout_date, workout_type, exercicios_ginasio?[], series_natacao?[] }`                                    | `WorkoutResponse`                    |
| DELETE | `/workouts/{id}`                  | ✅   | —                                                                                                             | `204 No Content`                     |
| GET    | `/analytics/weekly-summary`       | ✅   | —                                                                                                             | Weekly summary payload               |

### Payload shapes

```jsonc
// WorkoutCreate / WorkoutUpdate
{
  "workout_date": "2026-08-21",
  "workout_type": "gym",          // "gym" | "swim"
  "exercicios_ginasio": [
    { "exercise_name": "Supino", "sets": 4, "reps": 10 }
  ],
  "series_natacao": []            // ignored when workout_type = "gym"
}
```

```jsonc
// Weekly summary
{
  "total_workouts": 4,
  "total_gym_sets": 22,
  "total_gym_reps": 180,
  "total_swim_m": 3200,
  "running_equivalent_km": 12.8   // swim_km × 4
}
```

Interactive docs: `/docs` (Swagger UI) and `/redoc` (ReDoc) on the deployed backend.

---

## 🧪 UX principles applied

- **Mobile-first** — responsive layout with a bottom tab bar under the `sm` breakpoint.
- **Fitts's Law** — every interactive target is at least 44×44 px.
- **Error prevention** — submit button disabled until the form is valid; inline field errors.
- **Hick's Law** — segmented toggle between *Ginásio* and *Natação* reduces the choice to two options.
- **Continuous feedback** — `react-hot-toast` on every async action.
- **Low cognitive load** — short lists, metrics in cards, no decorative noise.
- **Empty states** — friendly copy with an explicit CTA.
- **Accessibility** — `aria-label`, `aria-selected`, `role="dialog"`, ESC-to-close modals, WCAG AA contrast.

---

## 🛠️ Development notes

- `pwdlib` with `BcryptHasher` is used instead of the older `passlib` — avoids the `argon2-cffi` native dependency that breaks the `python:slim` image.
- `Base.metadata.create_all` runs inside the FastAPI `lifespan` context, not at import time, so the app responds immediately even if the database is briefly unavailable.
- `--workers 2` is the default in the Render blueprint; tune for your instance size.
- All backend dependencies are pinned in `requirements.txt` for reproducible builds.
- The empty `package.json` at the repo root is intentional — it prevents Vercel from trying to build the Python project at the root when `rootDirectory` is being resolved.

---

## 📄 License

[MIT](./LICENSE) — use it, fork it, build on it.
