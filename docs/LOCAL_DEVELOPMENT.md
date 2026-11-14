# NyayaSaathi (न्यायसाथी) — Local Development Guide

This guide describes how to set up, develop, test, and run the **NyayaSaathi** application across all three services using the unified Node.js JavaScript npm workspace monorepo.

---

## 1. Monorepo Architecture & Services

NyayaSaathi uses an npm workspaces monorepo standardizing on modern **JavaScript ES Modules (`"type": "module"`)**:

```
nyaya-setu-ai/
├── package.json               # Root monorepo workspace manifest & concurrently scripts
├── .eslintrc.cjs              # Root ESLint configuration
├── frontend/                  # React 18 + Vite SPA (Port 3000)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
├── backend/                   # Node.js + Express API & Prisma ORM (Port 8000)
│   ├── package.json
│   ├── prisma/schema.prisma
│   ├── scripts/checkSupabase.js
│   ├── .env.example
│   └── src/
├── ai-engine/                 # Node.js + Express + Google GenAI RAG Service (Port 8001)
│   ├── package.json
│   ├── .env.example
│   └── src/
└── docs/                      # Technical documentation
```

### Port Matrix

| Service | Technology | Port | Health Endpoint | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | `3000` | `http://localhost:3000/health` | Multilingual citizen UI & chat interface |
| **Backend API** | Node.js, Express, Prisma | `8000` | `http://localhost:8000/health` | Core REST API, DB queries, auth & routing |
| **AI Engine** | Node.js, Express, Google GenAI | `8001` | `http://localhost:8001/health` | Multilingual RAG, statutory vector retrieval |

---

## 2. Prerequisites

- **Node.js**: `v20.0.0` or higher (verified on Node `v26.7.0`)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Supabase PostgreSQL 16 with `pgvector` enabled (remote project configured)

---

## 3. Environment Configuration

Each service manages its own scoped `.env` configuration file. Templates are documented in `.env.example`:

### A. Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Key variables:
- `PORT=8000`
- `NODE_ENV=development`
- `CORS_ORIGINS=http://localhost:3000,http://localhost:5173`
- `SUPABASE_URL=https://rmbfcfigiuyspsdutzov.supabase.co`
- `SUPABASE_ANON_KEY=sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW`
- `AI_ENGINE_URL=http://localhost:8001`
- `DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

### B. AI Engine (`ai-engine/.env`)
```bash
cp ai-engine/.env.example ai-engine/.env
```
Key variables:
- `AI_ENGINE_PORT=8001`
- `HOST=0.0.0.0`
- `LLM_PROVIDER=google` (or `mock` for offline development)
- `GEMINI_API_KEY=your-gemini-api-key`
- `GEMINI_MODEL=gemini-2.5-flash`
- `SUPABASE_URL=https://rmbfcfigiuyspsdutzov.supabase.co`
- `SUPABASE_ANON_KEY=sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW`

### C. Frontend (`frontend/.env`)
```bash
cp frontend/.env.example frontend/.env
```
Key variables:
- `VITE_API_URL=/api`
- `VITE_APP_NAME=NyayaSaathi`
- `VITE_DEFAULT_LANGUAGE=en`

---

## 4. Installation & Dependency Management

From the root directory, install all workspace dependencies cleanly:

```bash
npm install
```

This installs shared and workspace-specific packages deterministically.

To verify the database schema and pgvector similarity search function:
```bash
npm run db:check
```

---

## 5. Development Workflows & Scripts

### Run All Three Services Concurrently (Recommended)
```bash
npm run dev
# or
npm run dev:full
```
This spawns:
- `[AI]` listening on `http://localhost:8001`
- `[BACKEND]` listening on `http://localhost:8000`
- `[FRONTEND]` listening on `http://localhost:3000`

### Run Services Independently
In separate terminal windows:
```bash
# Terminal 1: AI Engine
npm run dev:ai

# Terminal 2: Backend API
npm run dev:backend

# Terminal 3: Frontend Client
npm run dev:frontend
```

---

## 6. Build, Test & Lint

All commands run across all workspaces:

```bash
# Production Build (Backend check + Vite production bundle)
npm run build

# Run Unit & Parity Tests
npm run test

# Run ESLint validation
npm run lint
```

---

## 7. Troubleshooting

### Port Already in Use (EADDRINUSE)
If a process is already running on port 3000, 8000, or 8001:
```bash
# Inspect processes holding the ports
lsof -i :3000 -i :8000 -i :8001

# Terminate lingering node processes
kill -9 $(lsof -ti:3000,8000,8001)
```

### Prisma Connection String Notice
If `DATABASE_URL` contains placeholder credentials, the backend automatically operates in resilient stateless mode and relies on the verified Supabase REST client for all legal statutory queries without crashing.
