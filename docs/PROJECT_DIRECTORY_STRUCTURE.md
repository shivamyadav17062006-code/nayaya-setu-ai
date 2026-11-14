# NyayaSaathi (न्यायसाथी) — Target Project Directory Structure

**Document:** `docs/PROJECT_DIRECTORY_STRUCTURE.md`  
**Standard:** 100% JavaScript (ES Modules, JSX, Node.js 20+ LTS)  
**Status:** Post-Migration Target Blueprint

---

## 1. Complete Post-Migration Repository Tree

```text
nayaya-setu-ai/
├── AGENTS.md                                # Permanent project instructions & agent rules
├── README.md                                # Project overview, quickstart & architecture
├── package.json                             # Root npm workspace manifest ("workspaces": ["frontend", "backend", "ai-engine"])
├── package-lock.json                        # Root npm dependency lockfile
├── .gitignore                               # Production gitignore rules
├── .env.example                             # Root environment variable template
├── docker-compose.yml                       # Local development PostgreSQL 16 + pgvector container
├── docker/
│   └── init.sql                             # Database extension initializer (vector, pg_trgm, unaccent)
│
├── docs/                                    # Architecture & Engineering Specifications
│   ├── ARCHITECTURE.md                      # System architecture and design
│   ├── ER_MODEL_AND_NORMALIZATION.md        # Database relational ER model & normalization analysis
│   ├── ERROR_ROOT_CAUSE_REPORT.md           # Deep-dive forensic analysis of 10 historical errors
│   ├── FINAL_TECH_STACK.md                  # Comprehensive technology stack specification
│   ├── IMPLEMENTATION_ROADMAP.md            # Phased migration roadmap and verification gates
│   ├── JAVASCRIPT_MIGRATION_PLAN.md         # Step-by-step file conversion plan (TS/Python -> JS)
│   ├── PROJECT_AUDIT.md                     # Codebase inventory and pre-migration audit
│   ├── PROJECT_DIRECTORY_STRUCTURE.md       # Target directory structure blueprint (this file)
│   └── SERVICE_CONTRACTS.md                 # Inter-service communication and API contracts
│
├── frontend/                                # Client Single-Page Application (React 18 + Vite + JSX)
│   ├── index.html                           # HTML entry point (title, viewport, fonts)
│   ├── package.json                         # Frontend dependencies (React, Vite, Tailwind, i18next)
│   ├── vite.config.js                       # Vite bundler configuration with /api proxy to :8000
│   ├── postcss.config.js                    # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.js                   # Tailwind theme tokens (saffron, navy, green)
│   └── src/
│       ├── main.jsx                         # React DOM root render
│       ├── App.jsx                          # Main router setup & layout hierarchy
│       ├── index.css                        # Global CSS, fonts (Noto Sans Devanagari), Tailwind directives
│       ├── api/                             # Axios HTTP client wrappers
│       │   ├── aid.js                       # /api/aid requests
│       │   ├── chat.js                      # /api/chat requests & session management
│       │   ├── client.js                    # Base Axios instance with auth interceptors
│       │   ├── eligibility.js               # /api/eligibility requests
│       │   ├── rights.js                    # /api/rights statutory queries
│       │   └── workflows.js                 # /api/workflows procedural guides
│       ├── components/                      # Reusable UI component library
│       │   ├── aid/
│       │   │   └── AidProviderCard.jsx      # Clinic card with address and 15100 dialer
│       │   ├── chat/
│       │   │   ├── ChatBubble.jsx           # User & assistant chat bubbles
│       │   │   ├── CitationBadge.jsx        # Clickable statutory provision pill
│       │   │   └── TypingIndicator.jsx      # Loading animation
│       │   ├── layout/
│       │   │   ├── Footer.jsx               # Civic awareness footer & helpline references
│       │   │   └── Navbar.jsx               # Header navigation & language switcher
│       │   ├── rights/
│       │   │   ├── CategoryCard.jsx         # Civic rights category grid item
│       │   │   └── SectionCard.jsx          # Statutory section compare view (Original vs Simple)
│       │   ├── ui/
│       │   │   ├── Badge.jsx                # Semantic badge indicator
│       │   │   ├── Button.jsx               # Accessible button component
│       │   │   ├── Card.jsx                 # Base container card
│       │   │   ├── LanguageSwitcher.jsx     # Hindi / English locale toggle
│       │   │   └── Spinner.jsx              # Loading spinner
│       │   └── workflow/
│       │       ├── StepCard.jsx             # Action step with required document checklist
│       │       └── WorkflowStepper.jsx      # Step-by-step procedure progression
│       ├── hooks/
│       │   └── useChat.js                   # Chat state, message queue, and session hook
│       ├── i18n/
│       │   ├── index.js                     # i18next configuration
│       │   └── locales/
│       │       ├── en.json                  # English UI translations
│       │       └── hi.json                  # Hindi UI translations (Devanagari)
│       ├── lib/
│       │   ├── supabase.js                  # Browser Supabase client (anon key)
│       │   └── utils.js                     # Tailwind class merge utility (cn)
│       └── pages/                           # Application page views
│           ├── AidFinder.jsx                # NALSA/SLSA/DLSA clinic directory & map view
│           ├── Chat.jsx                     # Conversational legal assistant interface
│           ├── Eligibility.jsx              # NALSA Section 12 free lawyer calculator
│           ├── Home.jsx                     # Landing page with KYR category highlights
│           ├── Navigator.jsx                # Grievance workflow navigator
│           ├── NotFound.jsx                 # 404 error page
│           ├── Rights.jsx                   # Know Your Rights library index
│           └── RightsCategory.jsx           # Specific category provisions viewer
│
├── backend/                                 # Node.js Express Gateway (Port 8000, ES Modules)
│   ├── package.json                         # Backend dependencies ("type": "module")
│   ├── .env.example                         # Backend environment template
│   ├── prisma/
│   │   ├── schema.prisma                    # Single Source of Truth schema (14 tables, @@map)
│   │   └── seed.js                          # Pure JavaScript statutory seeder
│   ├── scripts/
│   │   └── checkSupabase.js                 # 15-check Supabase diagnostic script
│   └── src/
│       ├── index.js                         # Server entry point & graceful shutdown
│       ├── app.js                           # Express application factory, middleware, rate limiting
│       ├── lib/
│       │   └── prisma.js                    # Prisma client singleton with offline resilience
│       ├── controllers/                     # Route controllers
│       │   ├── aidController.js             # Legal aid directory queries
│       │   ├── authController.js            # User registration & JWT authentication
│       │   ├── chatController.js            # Chat session persistence & AI service dispatch
│       │   ├── eligibilityController.js     # NALSA Section 12 logic engine
│       │   ├── rightsController.js          # Statutory rights & sections queries
│       │   └── workflowController.js        # Grievance procedure workflows
│       ├── middleware/
│       │   ├── auth.js                      # JWT bearer verification middleware
│       │   └── errorHandler.js              # Global Express error handler
│       ├── routes/                          # Express route definitions
│       │   ├── aid.js                       # /api/aid router
│       │   ├── auth.js                      # /api/auth router
│       │   ├── chat.js                      # /api/chat router
│       │   ├── eligibility.js               # /api/eligibility router
│       │   ├── index.js                     # Root API router (/api)
│       │   ├── rights.js                    # /api/rights router
│       │   └── workflows.js                 # /api/workflows router
│       ├── schemas/                         # Zod validation schemas
│       │   ├── authSchema.js                # Login & registration schema
│       │   ├── chatSchema.js                # Chat request schema
│       │   └── eligibilitySchema.js         # Eligibility input schema
│       └── services/                        # Business logic services
│           ├── aiService.js                 # Internal HTTP client calling Node AI service (:8001)
│           ├── supabaseService.js           # Supabase REST client & pgvector fallback queries
│           └── translationService.js        # Bhashini / Indic translation client
│
├── ai-engine/                               # Node.js AI & RAG Microservice (Port 8001, ES Modules)
│   ├── package.json                         # Node.js AI dependencies ("type": "module")
│   ├── .env.example                         # AI engine environment template
│   ├── scripts/
│   │   └── embedSections.js                 # CLI script to embed statutory chunks into pgvector
│   └── src/
│       ├── index.js                         # AI Express server bootstrap on port 8001
│       ├── config.js                        # Configuration loader (reads GEMINI_API_KEY, etc.)
│       ├── routes/                          # Express routers for AI capabilities
│       │   ├── embed.js                     # POST /embed — Text-to-vector endpoint
│       │   ├── health.js                    # GET /health — AI engine health probe
│       │   ├── query.js                     # POST /query — Main RAG synthesis endpoint
│       │   └── search.js                    # POST /search — Vector similarity search
│       └── services/                        # AI core services
│           ├── embeddingService.js          # 384-dim multilingual embedding engine
│           ├── intentService.js             # Intent classification (Labour, Women, Consumer, etc.)
│           ├── legalService.js              # Supabase legal chunk retriever via pgvector RPC
│           ├── llmService.js                # Google Gemini SDK client (@google/genai)
│           ├── promptTemplates.js           # Grounded legal prompt synthesis & citations
│           └── ragService.js                # Complete RAG coordination pipeline
│
├── supabase/                                # PostgreSQL Database Infrastructure
│   ├── README.md                            # Supabase setup, RPC verification & guide
│   ├── schema.sql                           # Unified 14-table schema, pgvector RPC & RLS
│   └── migrations/                          # Sequential, non-destructive SQL migrations
│       ├── 20261114000000_schema_alignment_and_persistence.sql
│       └── 20261114000001_enable_app_persistence_and_chunks_rls.sql
│
└── tests/                                   # Unified Multi-Tier Test Suite
    ├── vitest.config.js                     # Vitest test configuration
    ├── playwright.config.js                 # Playwright end-to-end browser test configuration
    ├── unit/                                # Vitest unit tests
    │   ├── backend/
    │   │   ├── eligibility.test.js          # NALSA Section 12 rule tests
    │   │   ├── prisma.test.js               # Prisma singleton resilience tests
    │   │   └── validation.test.js           # Zod schema validation tests
    │   └── ai-engine/
    │       ├── intent.test.js               # Intent classification tests
    │       └── promptTemplates.test.js      # Anti-hallucination prompt tests
    ├── integration/                         # Supertest Express API integration tests
    │   ├── aidRoutes.test.js                # /api/aid endpoint contracts
    │   ├── chatRoutes.test.js               # /api/chat endpoint contracts & fallbacks
    │   ├── healthRoutes.test.js             # /health endpoint contracts
    │   └── rightsRoutes.test.js             # /api/rights endpoint contracts
    └── e2e/                                 # Playwright browser end-to-end tests
        ├── chatJourney.spec.js              # Citizen chat flow & citation click
        ├── languageSwitch.spec.js           # English <-> Hindi locale change
        └── rightsCatalog.spec.js            # Statutory section navigation
```

---

## 2. Decommissioned Legacy Files Inventory

The following files from the legacy state are phased out and removed during the transition:

| Legacy File Path | Reason for Decommissioning | Replaced By |
| :--- | :--- | :--- |
| `page.tsx` (root) | Alien Next.js App Router boilerplate | Not needed in Vite Single-Page Application |
| `utils/supabase/server.ts` | Next.js Server Components cookie helper | `backend/src/services/supabaseService.js` |
| `utils/supabase/middleware.ts`| Next.js Edge middleware session helper | `backend/src/middleware/auth.js` |
| `utils/supabase/client.ts` | Next.js browser SSR client | `frontend/src/lib/supabase.js` |
| `backend/tsconfig.json` | TypeScript compiler configuration | Native Node.js 20+ ES Modules (`"type": "module"`) |
| `frontend/tsconfig.json` | TypeScript compiler configuration | Native Vite React JSX support |
| `frontend/tsconfig.node.json`| TypeScript Vite Node config | Native `vite.config.js` |
| `frontend/src/vite-env.d.ts`| TypeScript type declarations | Native Vite JS environment |
| `ai-engine/requirements.txt` | Python pip dependencies | `ai-engine/package.json` (npm dependencies) |
| `ai-engine/pyproject.toml` | Python build configuration | `ai-engine/package.json` |
| `ai-engine/venv/` | Python 3.14 virtual environment | Completely eliminated; replaced by Node.js |
| `ai-engine/main.py` | FastAPI application entry point | `ai-engine/src/index.js` (Express on :8001) |
| `ai-engine/embedding.py` | Python embedding script | `ai-engine/scripts/embedSections.js` |
| `ai-engine/app/**/*.py` | Python modules | Replaced by pure JavaScript modules in `ai-engine/src/` |
