# HydroLifts — Frontend

Interface em **React + Vite + TypeScript + TailwindCSS** para a app híbrida de
rastreamento de treinos de **Ginásio & Natação**.

## 🎨 Identidade visual — *Pool Palette*

| Token        | Uso                                       |
|--------------|-------------------------------------------|
| `pool-*`     | Cor primária (cyan cristalino)            |
| `navy-*`     | Profundidade, texto e superfícies escuras |
| `mint-*`     | Estados de sucesso e métricas atingidas   |
| `navy-50`    | Fundo da app (cinza gelo)                 |
| `white`      | Cards com `shadow-sm` e `rounded-2xl`     |

Fonte: **Inter** (carregada via Google Fonts no `index.html`).

## 🧱 Stack

- **React 18** + **Vite 5** + **TypeScript 5**
- **TailwindCSS 3** com tokens de marca em `tailwind.config.js`
- **lucide-react** para ícones consistentes
- **axios** com interceptors JWT + feedback de erro via `react-hot-toast`
- **react-router-dom** com `ProtectedRoute`
- **Context API** para auth (suficiente para 1 store)

## 🚀 Como correr

### 1. Backend já em execução

```bash
# noutro terminal, na raiz do monorepo
uvicorn app.main:app --reload --port 8000
```

### 2. Instalar dependências

```bash
cd frontend
npm install
```

### 3. Variáveis de ambiente (opcional)

Por defeito, o frontend fala com `/api` e o `vite.config.ts` faz proxy para
`http://localhost:8000`. Em produção, cria um `.env` com:

```
VITE_API_URL=https://api.teu-dominio.com
```

### 4. Dev server

```bash
npm run dev
# http://localhost:5173
```

### 5. Build de produção

```bash
npm run build
npm run preview
```

## 📱 Princípios UX/HCI aplicados

1. **Mobile-First** — Layout responsivo, tab bar inferior em mobile.
2. **Lei de Fitts** — Botões ≥ 44×44px (`min-h-[44px]` global).
3. **Prevenção de erros** — Validação inline + submit desativado.
4. **Lei de Hick** — Toggle segmentado reduz decisão a 2 opções.
5. **Feedback contínuo** — `Toaster` em sucesso/erro de qualquer chamada.
6. **Carga cognitiva reduzida** — Tabs e listas curtas; métricas em cards.
7. **Estados vazios** — Mensagens amigáveis com CTA explícito.
8. **Acessibilidade** — `aria-label`, `aria-selected`, contraste WCAG AA.

## 🗂️ Estrutura

```
frontend/
├── index.html
├── tailwind.config.js       # Pool Palette tokens
├── vite.config.ts           # proxy /api -> :8000
└── src/
    ├── main.tsx             # router + Toaster
    ├── index.css            # base + componentes utilitários
    ├── contexts/
    │   └── AuthContext.tsx
    ├── components/
    │   ├── Layout.tsx
    │   └── ProtectedRoute.tsx
    ├── lib/
    │   └── api.ts           # axios + interceptors + helpers tipados
    └── pages/
        ├── AuthView.tsx
        ├── DashboardView.tsx
        └── LogWorkoutView.tsx
```

## 🔌 Endpoints consumidos

| Método | Endpoint                    | Vista                |
|--------|-----------------------------|----------------------|
| POST   | `/auth/register`            | AuthView (registo)   |
| POST   | `/auth/login`               | AuthView (login)     |
| POST   | `/workouts`                 | LogWorkoutView       |
| GET    | `/workouts`                 | DashboardView        |
| GET    | `/analytics/weekly-summary` | DashboardView        |
