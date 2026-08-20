# 🚀 Guia de Deploy — HydroLifts

Recomendação para **produção séria com baixo custo**:

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  VERCEL  (free)         │  HTTPS  │  RAILWAY  (Hobby $5/mês) │
│  Frontend React/Vite    │ ───────►│  Backend FastAPI        │
│  CDN global, SSL auto   │         │  Postgres plugin        │
└─────────────────────────┘         └─────────────────────────┘
```

Total: **$5/mês** com zero cold-starts, HTTPS, BD persistente.

---

## 1️⃣ Deploy do Backend no Railway

### Opção A — pelo dashboard (mais visual)

1. Vai a [https://railway.app/new](https://railway.app/new)
2. Clica em **"Deploy from GitHub repo"**
3. Seleciona o teu repositório do HydroLifts
4. Railway deteta o `Dockerfile` automaticamente. Se não detetar:
   - **Settings → Build → Builder** = `DOCKERFILE`
   - **Settings → Deploy → Start Command** = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Clica em **"+ New" → "Database" → "PostgreSQL"** para criar a BD
6. Clica no serviço da API → **Variables** → adiciona:
   - `Secret_Key` — clica em "Generate" para uma string aleatória
   - `Hashing_Algorithm` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `60`
   - `ALLOWED_ORIGINS` = `https://hydrolifts.vercel.app` (vais atualizar depois de ter o URL)
   - `Database_URL` — clica em "Reference" e escolhe a variável da BD Postgres
7. Clica em **Settings → Networking → "Generate Domain"** → dá-te algo tipo `hydrolifts-api.up.railway.app`
8. **Settings → Healthcheck Path** = `/`

### Opção B — pela CLI Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway add --plugin postgresql
railway up
```

---

## 2️⃣ Deploy do Frontend no Vercel

### Opção A — pelo dashboard (recomendado)

1. Vai a [https://vercel.com/new](https://vercel.com/new)
2. **Import Project** → seleciona o repositório
3. Em **Root Directory** clica em "Edit" e escolhe `frontend`
4. Framework detetado: **Vite** ✅
5. Clica em **"Environment Variables"** e adiciona:
   - `VITE_API_URL` = `https://hydrolifts-api.up.railway.app` (o URL do Railway)
6. **Deploy** → em ~60s tens o site no ar em `https://hydrolifts.vercel.app`

### Opção B — pela CLI

```bash
cd frontend
npm install -g vercel
vercel
# segue os prompts e define VITE_API_URL quando perguntar
```

---

## 3️⃣ Atualizar o CORS no Railway

Agora que tens o URL público do frontend, volta ao Railway e atualiza:

```
ALLOWED_ORIGINS = https://hydrolifts.vercel.app,https://www.hydrolifts.app
```

(O segundo é só se comprares um domínio custom.)

---

## 4️⃣ Smoke test em produção

```bash
# 1. Backend healthcheck
curl https://hydrolifts-api.up.railway.app/

# 2. Criar conta via frontend ou:
curl -X POST https://hydrolifts-api.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"eu@teste.com","password":"minhaSenha123"}'

# 3. Login
curl -X POST https://hydrolifts-api.up.railway.app/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=eu@teste.com" \
  --data-urlencode "password=minhaSenha123"
```

Abre o browser em **https://hydrolifts.vercel.app**, faz login e regista um treino de teste.

---

## 🆘 Alternativas

### Tudo no Railway (100% numa plataforma)

```bash
# Backend + Postgres no Railway, frontend como Static Site no Railway
# Custo: ~$3-5/mês conforme tráfego
```

Adiciona ao `railway.toml`:

```toml
[[services]]
name = "hydrolifts-web"
builder = "NIXPACKS"
rootDir = "frontend"
buildCommand = "npm install && npm run build"
startCommand = "npx serve -s dist -l $PORT"
```

### Tudo no Render (free, com sleep)

⚠️ Limitações:
- Backend adormece após 15 min idle (1min cold-start)
- Postgres free expira em 30 dias
- Para produção → plano Starter ($7/mês cada serviço)

`render.yaml` já está preparado — basta ir a [https://dashboard.render.com/select-repo?blueprint=render.yaml](https://dashboard.render.com/select-repo?blueprint=render.yaml).

---

## 🔐 Checklist de Segurança pré-produção

- [x] `bcrypt<4.0` fixado no `requirements.txt`
- [x] `python-multipart` instalado
- [x] CORS configurado com allowlist (não usar `*`)
- [ ] `Secret_Key` gerado aleatoriamente no Railway (NUNCA commitar)
- [ ] `Database_URL` aponta para Postgres gerido (não SQLite local)
- [ ] Variáveis sensíveis apenas no painel Railway/Vercel
- [ ] Domínio custom (opcional) com SSL automático

---

## 📊 Custos estimados

| Plataforma | Serviço | Free tier | Produção low-traffic |
|---|---|---|---|
| Vercel | Frontend SPA | $0 (ilimitado para hobby) | $0 |
| Railway | FastAPI + Postgres | $1 crédito/mês (insuficiente) | **$5/mês** Hobby |
| **Total** | | — | **~$5/mês** |

Para escalar (muitos utilizadores):
- Railway Pro: ~$20/mês + usage
- Vercel Pro: $20/mês (analytics + SLA)
