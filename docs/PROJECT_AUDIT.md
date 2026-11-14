# NyayaSaathi (न्यायसाथी) — Comprehensive Project Audit

**Date:** November 2026  
**Auditor:** Senior Software Architect, Database Architect & AI Systems Engineer  
**Repository:** `/Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai`

---

## 1. Executive Summary

NyayaSaathi is an AI-powered multilingual legal awareness and Know Your Rights (KYR) platform for Indian citizens. The platform's mission is to translate complex statutory legal provisions into plain language, provide step-by-step grievance workflows, direct citizens to free legal aid clinics (NALSA/SLSA/DLSA under Section 12 of the Legal Services Authorities Act, 1987), and offer conversational legal awareness grounded in authentic Indian statutes.

This audit evaluates the entire repository, catalogs all source and configuration files, identifies architectural misalignments (including accidental Next.js artifacts in a Vite SPA project), and outlines the strategy to consolidate the stack around modern **JavaScript (ES Modules)**, eliminating Python dependencies.

---

## 2. Codebase Inventory & Directory Structure

```text
nayaya-setu-ai/
├── AGENTS.md                  # Permanent AI & engineering project instructions
├── README.md                  # Project overview, quick start, and architecture
├── package.json               # Root npm workspace manifest
├── package-lock.json          # Root npm lockfile
├── .gitignore                 # Production ignore rules across all tiers
├── .env                       # Root environment variables (untracked)
├── .env.example               # Root environment template
├── .env.local                 # Local environment file (untracked)
├── page.tsx                   # [ANOMALY] Next.js App Router artifact (alien to Vite)
├── skills-lock.json           # Agent skills lockfile
├── docker-compose.yml         # Local PostgreSQL 16 + pgvector & pgAdmin
├── docker/
│   └── init.sql               # PostgreSQL extension initialization (vector, pg_trgm, unaccent)
├── utils/                     # [ANOMALY] Next.js Supabase SSR helper files
│   └── supabase/
│       ├── client.ts          # Browser client helper
│       ├── middleware.ts      # Next.js Edge middleware session refresher
│       └── server.ts          # Next.js Server Components cookie helper
├── docs/                      # Architectural & design documentation
│   ├── ARCHITECTURE.md
│   ├── ER_MODEL_AND_NORMALIZATION.md
│   ├── ERROR_ROOT_CAUSE_REPORT.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   └── PROJECT_AUDIT.md
├── frontend/                  # React Single-Page Application (SPA)
│   ├── index.html             # Vite HTML entry point
│   ├── vite.config.ts         # Vite bundler config with /api proxy to :8000
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript config (to be transitioned to JS/JSX)
│   ├── postcss.config.js      # PostCSS config for Tailwind
│   ├── tailwind.config.js     # Tailwind CSS theme configuration
│   └── src/
│       ├── main.tsx           # React DOM root entry
│       ├── App.tsx            # Application routing (Home, Rights, Navigator, AidFinder, Chat)
│       ├── api/               # Axios API clients (chat, rights, aid, workflows, eligibility)
│       ├── components/        # Reusable UI components (chat bubbles, citation badges, steppers)
│       ├── hooks/             # Custom React hooks (useChat)
│       ├── i18n/              # Multilingual locale strings (English, Hindi)
│       ├── lib/               # Utilities and Supabase client
│       └── pages/             # Page views
├── backend/                   # Node.js + Express API Gateway
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript compiler configuration
│   ├── .env.example           # Backend environment template
│   ├── prisma/
│   │   ├── schema.prisma      # Single Source of Truth Prisma schema (14 tables)
│   │   └── seed.ts            # Deterministic statutory seed data
│   ├── scripts/
│   │   └── checkSupabase.ts   # Database verification script (15 health checks)
│   └── src/
│       ├── index.ts           # Server bootstrap & graceful shutdown
│       ├── app.ts             # Express middleware, rate limiting, and /health
│       ├── lib/
│       │   └── prisma.ts      # Prisma client singleton with offline resilience
│       ├── controllers/       # Route controllers (chat, rights, aid, workflows, eligibility, auth)
│       ├── routes/            # Express route definitions
│       ├── services/          # Business logic (supabaseService, aiService, translationService)
│       ├── middleware/        # Auth & error handling middleware
│       └── types/             # Type definitions
├── ai-engine/                 # Python FastAPI AI service (Target for JS migration)
│   ├── main.py                # FastAPI entry point (:8001) with CORS & Lifespan
│   ├── requirements.txt       # Python dependencies (torch, sentence-transformers, langchain)
│   ├── pyproject.toml         # Python packaging configuration
│   ├── embedding.py           # Standalone chunking & embedding CLI script
│   └── app/
│       ├── config.py          # Pydantic Settings
│       ├── database.py        # Async SQLAlchemy connection
│       ├── schemas.py         # Pydantic request/response models
│       ├── routers/           # Endpoints: /health, /query, /embed, /search
│       └── services/          # embedding_service, legal_service, llm_service, rag_service
├── supabase/                  # PostgreSQL schema, migrations, and documentation
│   ├── schema.sql             # Unified 14-table schema + pgvector RPC + RLS policies
│   ├── README.md              # Supabase setup guide & verification instructions
│   └── migrations/
│       ├── 20261114000000_schema_alignment_and_persistence.sql
│       └── 20261114000001_enable_app_persistence_and_chunks_rls.sql
└── .agents/                   # Supabase agent skills & best practices
    └── skills/
        ├── supabase/
        └── supabase-postgres-best-practices/
```

---

## 3. Technology Stack & Current Language Distribution

| Layer | Current Implementation | Target JavaScript Architecture | Migration Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | React 18, JavaScript (`.jsx`), Vite | TypeScript in place; needs conversion to pure JSX |
| **Backend API** | Node.js, Express, TypeScript | Node.js, Express, ES Modules (`.js`) | Functional TypeScript; needs conversion to pure ESM JS |
| **AI / RAG Service** | Python 3.14, FastAPI, PyTorch | Node.js, Express/Fastify, ES Modules | Active in Python; target for complete Node.js migration |
| **LLM Integration** | LangChain Google GenAI (Python) + Direct Axios | Official Google Gemini JavaScript SDK (`@google/genai`) | Partial direct calls in backend; needs official SDK |
| **Vector Search** | PostgreSQL `pgvector` via Python embedding script | PostgreSQL `pgvector` via Node.js script / RPC | RPC verified in SQL; ingestion needs Node.js script |
| **Database ORM** | Prisma 5.22.0 (`@prisma/client`) | Prisma Client for JavaScript | Aligned to 14 PostgreSQL tables; JavaScript ready |
| **Database Engine** | Supabase PostgreSQL 16 | Supabase PostgreSQL 16 | Fully configured and verified |
| **Testing** | Jest (Backend, 0 tests) | Vitest, Supertest, Playwright | No tests implemented; Vitest to be configured |
| **Package Manager**| npm Workspaces | npm Workspaces | Configured across `frontend`, `backend` |

---

## 4. Accidental Next.js Artifacts Audit

During an earlier turn, Next.js boilerplate snippets were pasted into the repository root:
1. `page.tsx`: Uses `import { cookies } from 'next/headers'`.
2. `utils/supabase/server.ts`: Uses `@supabase/ssr` with `cookies()` from `next/headers`.
3. `utils/supabase/middleware.ts`: Uses `NextRequest`, `NextResponse` from `next/server`.
4. `utils/supabase/client.ts`: Uses `createBrowserClient` from `@supabase/ssr`.

### Assessment:
- **Project Frontend Type**: The project is a client-side Single-Page Application (SPA) built with **Vite** (`frontend/vite.config.ts`, `frontend/index.html`).
- **Compatibility**: Vite does not provide or support `next/headers` or `next/server`. These files cannot execute in Vite.
- **Current Usage**: Zero application files in `frontend/src/` or `backend/src/` import or reference `page.tsx` or `utils/supabase/`.
- **Recommendation**: Per project instructions, these files are preserved in place for now and documented. They should be decommissioned in the cleanup phase.

---

## 5. Python AI Engine Capabilities to Port to Node.js

The `ai-engine/` directory provides four core capabilities that must be ported to Node.js:
1. **Multilingual Text Embeddings**:
   - Currently uses `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions).
   - In Node.js: Can be executed via `@xenova/transformers` (local ONNX runtime, zero Python dependency) or Google Gemini's `text-embedding-004` (via official JS SDK).
2. **Intent Classification**:
   - Classifies queries into `LABOUR`, `WOMEN_RIGHTS`, `CONSUMER`, `CRIMINAL`, `PROPERTY`, `CONSTITUTIONAL`, `GENERAL`.
   - In Node.js: Implemented via Gemini structured JSON output schema or rule-based fast classifier.
3. **pgvector Similarity Search**:
   - Currently calls Supabase RPC `match_legal_chunks(query_embedding, match_count, min_similarity)`.
   - In Node.js: Fully supported via `@supabase/supabase-js` (`supabase.rpc('match_legal_chunks', { ... })`).
4. **Grounded Legal Prompt Synthesis**:
   - Injects statutory context, enforces legal disclaimers, numbers action steps, and adds NALSA helpline 15100.
   - In Node.js: Standard template function combined with `@google/genai`.

---

## 6. Test Suite Status

- **Unit Tests**: Zero tests in `frontend/src/` and `backend/src/`.
- **E2E Tests**: Zero Playwright or Cypress tests.
- **Action Required**: Establish Vitest in `backend/` and `frontend/`, configure Supertest for API integration tests, and add Playwright for critical citizen user journeys.
