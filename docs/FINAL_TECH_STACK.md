# NyayaSaathi (न्यायसाथी) — Final JavaScript Technology Stack

**Document:** `docs/FINAL_TECH_STACK.md`  
**Architecture:** 100% JavaScript Full-Stack (Browser, Server & AI Layers)  
**Target Runtime:** Node.js 20+ LTS  
**Standard:** ECMAScript Modules (ESM)

---

## 1. Architectural Overview & Stack Summary

The final technology stack standardizes on **JavaScript across every tier**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (FRONTEND)                         │
│   React 18 · JSX · Vite 5 · Tailwind CSS · TanStack Query · i18next    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON REST
┌───────────────────────────────────▼────────────────────────────────────┐
│                       GATEWAY LAYER (BACKEND)                          │
│   Node.js 20+ · Express 4 · ES Modules · Prisma JS · Zod · Helmet      │
│   (Owns: Auth, Sessions, User Persistence, Authorization)              │
└─────────────────┬──────────────────────────────────┬───────────────────┘
                  │ SQL / Connection Pooler          │ HTTP / JSON (:8001)
┌─────────────────▼──────────────────┐   ┌───────────▼───────────────────┐
│       DATABASE & VECTOR LAYER      │   │       AI SERVICE LAYER        │
│   Supabase PostgreSQL 16           │   │   Node.js 20+ · Express 4     │
│   • 14 Relational Tables           │   │   • @google/genai (Gemini SDK)│
│   • pgvector (384-dim HNSW Index)  │   │   • Embeddings & RAG Pipeline │
│   • match_legal_chunks() RPC       │   │   • Multilingual Normalizer   │
└────────────────────────────────────┘   └───────────────────────────────┘
```

---

## 2. Detailed Tier Specifications

### 2.1 Frontend Tier (`frontend/`)
- **Core Library:** `react` (^18.3.1) & `react-dom` (^18.3.1).
- **Language / Syntax:** Modern JavaScript (`.jsx`, `.js`) with ES2023+ syntax.
- **Build Tool:** `vite` (^5.4.x) — ultra-fast HMR and optimized production bundling.
- **Routing:** `react-router-dom` (^6.22.x) for declarative client-side route management.
- **Styling & Design System:**
  - `tailwindcss` (^3.4.x) & `postcss` (^8.4.x).
  - High-contrast civic UI with Indian cultural accents (Tiranga Saffron `#FF9933`, Ashoka Navy `#000080`, India Green `#138808`).
  - Icons: `lucide-react` (^0.344.x).
- **Asynchronous State & Data Fetching:** `@tanstack/react-query` (^5.24.x) and `axios` (^1.6.x).
- **Internationalization (i18n):** `i18next` (^23.10.x) and `react-i18next` (^14.1.x) supporting English and Hindi (extensible to Marathi, Tamil, Telugu, and Bengali).

### 2.2 Backend Gateway Tier (`backend/`)
- **Runtime:** Node.js 20+ LTS (`"type": "module"` in `package.json`).
- **Web Framework:** `express` (^4.18.x) — lightweight, unopinionated HTTP engine.
- **ORM / Query Engine:** `@prisma/client` (^5.22.x) targeting PostgreSQL via Prisma's JavaScript Client.
- **Security & Hardening:**
  - `helmet` (^7.1.x): HTTP security headers and Content Security Policy.
  - `cors` (^2.8.x): Cross-Origin Resource Sharing restricting browser access to configured frontend hosts.
  - `express-rate-limit` (^7.2.x): IP-based request throttling protecting chat and API endpoints.
  - `bcryptjs` (^2.4.x): Cryptographic password hashing for user accounts.
  - `jsonwebtoken` (^9.0.x): Stateless JWT token issuance and signature verification.
- **Runtime Data Validation:** `zod` (^3.22.x) for strict validation of citizen requests, session parameters, and auth payloads.
- **Observability:** `morgan` (^1.10.x) for HTTP access logs and `winston` (^3.12.x) for structured application logging.

### 2.3 AI Engine Tier (`ai-engine/`)
- **Runtime:** Node.js 20+ LTS (`"type": "module"`).
- **Framework:** `express` (^4.18.x) listening on dedicated port `8001`.
- **LLM SDK:** `@google/genai` (official Google Gemini JavaScript SDK) connecting to `gemini-2.5-flash`.
- **Text Embedding Engine:**
  - Primary: `@xenova/transformers` (local in-process HuggingFace ONNX pipeline executing `paraphrase-multilingual-MiniLM-L12-v2` in 384 dimensions).
  - Alternative: Gemini `text-embedding-004` via `@google/genai`.
- **Statutory Context Grounding:** In-process prompt grounding module enforcing:
  1. Strict reliance on verified Indian statutes (Payment of Wages Act 1936, PWDVA 2005, CPA 2019, LSAA 1987).
  2. Mandatory NALSA National Legal Helpline (`15100`) and DLSA referral citations.
  3. Factual disclaimer prohibiting legal hallucination.

### 2.4 Database & Vector Search Tier (`supabase/`)
- **Engine:** PostgreSQL 16 (hosted on Supabase).
- **Vector Search Extension:** `pgvector` (`v0.5.x+`).
- **Vector Dimension:** `384` dimensions matching multilingual sentence embeddings.
- **Indexing Method:** Hierarchical Navigable Small World (`HNSW`) index with `vector_cosine_ops` for $O(\log N)$ semantic retrieval.
- **Stored Procedure:** `match_legal_chunks(query_embedding, match_count, min_similarity)` returning matched sections, parent acts, and cosine similarity scores.
- **Security Layer:** Row Level Security (RLS) enabled across all 14 tables. Public read on verified statutory data; restricted write on user chat sessions.

### 2.5 Testing & Quality Assurance Suite
- **Unit & Integration Testing:** `vitest` (^1.3.x) — native ES Module test runner with blazing speed and zero transpilation overhead.
- **API Contract Testing:** `supertest` (^6.3.x) — programmatic HTTP assertions testing Express route handlers and middleware.
- **End-to-End Testing:** `@playwright/test` (^1.42.x) — automated browser testing verifying real citizen interactions across Chromium, Firefox, and WebKit.
- **Code Quality:** `eslint` (^8.57.x) configured for modern JavaScript ESM, React JSX, and accessibility rules (`eslint-plugin-jsx-a11y`).

---

## 3. Technology Evaluation & Decision Rationale

| Architectural Decision | Chosen Technology | Alternatives Rejected | Rationale |
| :--- | :--- | :--- | :--- |
| **Language Unification** | JavaScript (ESM) | TypeScript / Python split | Eliminates multi-runtime overhead; removes complex build steps; standardizes tooling around npm; simplifies deployment to a single Node.js runtime. |
| **LLM Integration** | Official `@google/genai` | LangChain / Python FastAPI | LangChain introduces massive abstraction bloat and breaking upstream API changes. The official Google SDK is lightweight, fast, and directly maintained by Google. |
| **Embeddings in Node.js**| `@xenova/transformers` | External PyTorch server | Running ONNX MiniLM embeddings directly in Node.js eliminates the entire 2GB Python virtual environment, PyTorch wheels, and cross-service latency. |
| **Testing Harness** | Vitest + Supertest | Jest + Mocha | Jest requires complex Babel/TS transform pipelines for ESM. Vitest executes modern ES Modules natively with out-of-the-box JSX support. |
| **Schema Validation** | Zod | Manual `typeof` checks | Provides runtime type safety and data sanitization for API endpoints without needing a TypeScript compiler at runtime. |
