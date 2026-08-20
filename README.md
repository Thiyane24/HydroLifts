# HydroLifts 💪🏊

App híbrida para rastrear treinos de **Ginásio & Natação** num único dashboard.
Registas séries/exercícios, vês a tua carga semanal, e a app converte tudo
para um *running-equivalent* (km) para comparar dias sem泳 nem halterofilismo.

> **Identidade visual — Pool Palette** (cyan + navy + mint). Mobile-first, WCAG AA,
> feedback contínuo via `react-hot-toast`.

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 · Vite 5 · TypeScript 5 · TailwindCSS 3 · lucide-react · axios · react-router-dom · react-hot-toast |
| **Backend** | FastAPI 0.115 · SQLAlchemy 2 · Pydantic 2 · pwdlib (bcrypt) · PyJWT |
| **Base de dados** | PostgreSQL 16 (prod) · SQLite (dev fallback) |

---

## 🗂️ Estrutura do monorepo

```
HydroLifts/
├── app/                      # backend FastAPI
│   ├── main.py               # entrypoint (lifespan → /healthz)
│   ├── database.py           # engine + SessionLocal
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic DTOs
│   ├── security.py           # bcrypt + JWT
│   └── routers/
│       ├── auth.py
│       ├── workouts.py
│       └── analytics.py
├── frontend/                 # SPA React/Vite
│   ├── src/
│   │   ├── pages/            # AuthView · DashboardView · LogWorkoutView
│   │   ├── lib/api.ts        # axios + interceptors
│   │   └── contexts/         # AuthContext
│   ├── vercel.json           # rootDirectory: frontend
│   └── vite.config.ts        # /api → :8000 (dev proxy)
├── Dockerfile                # backend (python:3.11-slim)
├── railway.toml              # backend (auto-detectado)
├── render.yaml               # backend (legacy / alt deploy)
├── vercel.json               # frontend (root: frontend/)
└── requirements.txt          # deps backend pinadas
```

---

## 🚀 Quickstart (local)

### 1. Backend

```bash
# requer Python 3.11+
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# variáveis mínimas (ver secção "Environment variables")
export Secret_Key=$(python -c "import secrets; print(secrets.token_hex(32))")
export Hashing_Algorithm=HS256
export ACCESS_TOKEN_EXPIRE_MINUTES=60

uvicorn app.main:app --reload --port 8000
# http://localhost:8000
# http://localhost:8000/healthz  →  {"status":"ok"}
# http://localhost:8000/docs      →  Swagger UI
```

### 2. Frontend (noutro terminal)

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

O `vite.config.ts` faz proxy de `/api/*` → `http://localhost:8000`, por isso
em dev não precisas de `.env`.

---

## 🔐 Environment variables

### Backend (obrigatórias)

| Key | Descrição | Exemplo |
|---|---|---|
| `Secret_Key` | Chave JWT (≥ 32 bytes random) | `openssl rand -hex 32` |
| `Hashing_Algorithm` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | TTL do token | `60` |
| `DATABASE_URL` | Connection string | `postgresql://user:pw@host/db?sslmode=require` |
| `ALLOWED_ORIGINS` | Origens CORS (CSV) | `https://hydrolifts.vercel.app,https://hydrolifts.app` |

Sem `DATABASE_URL`, o backend cai para SQLite em `./treinos.db` (bom para dev,
**não** recomendado em produção — não persiste em deploys efémeros).

### Frontend

| Key | Descrição | Default |
|---|---|---|
| `VITE_API_URL` | URL público do backend (sem trailing slash) | `/api` (usa proxy em dev) |

---

## ☁️ Deploy

### Frontend → Vercel

`vercel.json` na raiz aponta para `frontend/` automaticamente.

1. **Import Git Repository** → `Thiyane24/HydroLifts`
2. Framework preset detetado: **Vite** (override se necessário)
3. **Environment Variables** → `VITE_API_URL` = URL público do backend
4. Deploy

Cada `git push` em `main` redesenha.

### Backend → Koyeb (recomendado, free tier)

1. **Create Database** → PostgreSQL, region à escolha, plano **Free**
   - copia a **Connection string** (inclui `?sslmode=require`)
2. **Create Service** → Docker → repo `Thiyane24/HydroLifts` → branch `main`
3. Instance: **Free (eco)**, Port: **8000**
4. **Environment Variables**:
   - `Secret_Key` → Generate
   - `Hashing_Algorithm` → `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` → `60`
   - `DATABASE_URL` → connection string do passo 1
   - `ALLOWED_ORIGINS` → URL do Vercel (preencher após primeiro deploy do frontend)
5. Deploy
6. **Settings → Domains** → gerar subdomínio `*.koyeb.app`

### Backend → Railway (alternativa)

`railway.toml` + `Dockerfile` detetados automaticamente.

1. **New Project** → **Deploy from GitHub** → `Thiyane24/HydroLifts`
2. Adicionar **Postgres plugin** (ou externo)
3. **Variables** → mesmas do Koyeb acima (Railway expõe `DATABASE_URL` automaticamente)
4. **Settings → Networking** → **Generate Domain**

### Backend → Render (se o rate limit passar)

`render.yaml` pronto. **Render free tier** hiberna após 15 min — primeira
request demora ~30 s. **Recomendado**: pelo menos **Starter $7/mês**.

> ⚠️ Render às limita criação de serviços por IP — se aparecer "Name in use"
> ou rate-limit, espera 24 h ou usa Koyeb.

---

## 🔌 API (resumo)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| GET | `/` | ❌ | Boas-vindas |
| GET | `/healthz` | ❌ | Healthcheck |
| POST | `/auth/register` | ❌ | `{ email, password }` |
| POST | `/auth/login` | ❌ | OAuth2PasswordRequestForm → JWT |
| POST | `/workouts` | ✅ | `{ workout_date, workout_type, exercicios_ginasio? \| series_natacao? }` |
| GET | `/workouts` | ✅ | Histórico do user |
| GET | `/analytics/weekly-summary` | ✅ | Totais + running-equivalent |

Documentação interactiva: **`/docs`** (Swagger UI) · **`/redoc`**

---

## 🧪 UX/HCI principles aplicados

1. **Mobile-First** — layout responsivo, tab bar inferior
2. **Lei de Fitts** — alvos ≥ 44×44 px
3. **Prevenção de erros** — validação inline, submit desativado quando inválido
4. **Lei de Hick** — toggle segmentado (gym vs swim) reduz decisão a 2 opções
5. **Feedback contínuo** — `Toaster` em cada sucesso/erro
6. **Carga cognitiva** — listas curtas, métricas em cards
7. **Estados vazios** — mensagens amigáveis com CTA explícito
8. **Acessibilidade** — `aria-label`, `aria-selected`, contraste WCAG AA

---

## 📝 Notas de performance

- `pwdlib` em vez de `passlib` — bcrypt direto, sem argon2 C lib no slim image
- `/healthz` separado da lógica pesada → Render/Koyeb healthcheck não bloqueia
- `create_all` movido para `lifespan` → app responde imediatamente
- `--workers 2` por padrão
- Requirements pinned → install reproduzível, sem resolve surpresa

---

## 📄 Licença

MIT — faz o que quiseres.
