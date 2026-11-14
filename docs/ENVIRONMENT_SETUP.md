# NyayaSaathi (न्यायसाथी) — Environment Configuration & Security Setup

**Document:** `docs/ENVIRONMENT_SETUP.md`  
**Purpose:** End-to-end environment configuration, secret isolation, and credential rotation guide.

---

## 1. Environment Architecture & Secret Separation

NyayaSaathi adheres to the **Principle of Least Privilege**: credentials are isolated to the specific tier that requires them.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT TIER                            │
│  File: frontend/.env                                                   │
│  Exposed to browser: YES                                               │
│  Allowed: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY      │
│  STRICTLY FORBIDDEN: Database passwords, Gemini API keys, Service keys │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND GATEWAY TIER                            │
│  File: backend/.env                                                    │
│  Exposed to browser: NO (Server-Side Only)                             │
│  Owns: DATABASE_URL (Pooler), DIRECT_URL, SUPABASE_SERVICE_ROLE_KEY,   │
│        JWT_SECRET, GEMINI_API_KEY, CORS_ORIGINS                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        AI MICROSERVICE TIER                            │
│  File: ai-engine/.env                                                  │
│  Exposed to browser: NO (Internal Microservice)                        │
│  Owns: GEMINI_API_KEY, GEMINI_MODEL, EMBEDDING_MODEL, AI_ENGINE_PORT,  │
│        SUPABASE_URL, SUPABASE_ANON_KEY (Read-Only Statutory Access)    │
│  STRICTLY FORBIDDEN: DATABASE_URL, DB passwords, JWT secrets,          │
│                      SUPABASE_SERVICE_ROLE_KEY                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Configuration Guide

### Step 1: Copy Environment Templates
From the repository root, copy the provided templates to their local `.env` destinations:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp ai-engine/.env.example ai-engine/.env
cp frontend/.env.example frontend/.env
```
*(Note: All `.env` files are ignored by Git and will remain strictly local.)*

---

### Step 2: Configure Supabase Database & API Keys

1. **Obtain Project URL and API Keys**:
   - Navigate to **Supabase Dashboard > Project Settings > API**.
   - Copy the **Project URL** (e.g., `https://rmbfcfigiuyspsdutzov.supabase.co`).
   - Copy the **anon public key** (`sb_publishable_...`).
   - Copy the **service_role secret key** (revealed under secret keys).
2. **Obtain Database Connection Strings**:
   - Navigate to **Supabase Dashboard > Project Settings > Database**.
   - Under **Connection string > URI**:
     - **Mode: Session (Port 5432)** $\to$ Use this as `DATABASE_URL` in `backend/.env`.
     - **Mode: Direct (Port 5432)** $\to$ Use this as `DIRECT_URL` in `backend/.env`.
3. **URL-Encode Reserved Characters in Passwords**:
   If your database password contains characters like `@`, `:`, `/`, `#`, `?`, `%`, `&`, `[`, or `]`, you must URL-encode them:
   ```javascript
   // Example in Node.js REPL:
   encodeURIComponent('MyPass@123#') // returns 'MyPass%40123%23'
   ```
   *Incorrect:* `postgresql://postgres:MyPass@123#@db...` (Fails URI parser)  
   *Correct:* `postgresql://postgres:MyPass%40123%23@db...` (Succeeds)

---

### Step 3: Configure Google Gemini AI

1. Go to **[Google AI Studio](https://aistudio.google.com)**.
2. Generate an API Key.
3. Add the key to `backend/.env` and `ai-engine/.env`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   GOOGLE_API_KEY="AIzaSy..."
   GEMINI_MODEL="gemini-2.5-flash"
   ```
   *(Note: The AI engine supports `LLM_PROVIDER="mock"` for zero-cost local testing without an active API key).*

---

### Step 4: Configure Frontend Client

In `frontend/.env`:
```env
VITE_API_URL="/api"
VITE_SUPABASE_URL="https://rmbfcfigiuyspsdutzov.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW"
```

---

## 3. Git Security Audit & Findings

### 3.1 Audit Methodology
A non-destructive audit of the Git working tree, staging index, and commit history was performed using safe Git commands:
```bash
git ls-files | grep -E "(\.env|secret|key|cert|pem|token|password)"
git log --name-only --all | grep -E "(\.env|secret|password|credentials)" | sort -u
```

### 3.2 Audit Findings
- **Currently Tracked Environment Files**:
  - `.env.example`
  - `backend/.env.example`
  - `ai-engine/.env.example`
  - `frontend/.env.example`
- **Zero Real `.env` Files Committed**: No actual `.env` files (`.env`, `backend/.env`, `ai-engine/.env`, `frontend/.env`, `.env.local`) have ever been committed to the repository history.
- **Git Ignore Protection**: The root `.gitignore` enforces exclusion of `.env`, `.env.*`, `*.pem`, `*.key`, `service-account*.json`, and `supabase/.temp/`, with explicit whitelist negation for `!.env.example`.

---

## 4. Credential Rotation & Incident Response Procedure

If a database password, Supabase secret key, or Gemini API key is ever accidentally pushed or exposed:

1. **Step 1: Rotate the Secret Immediately in the Upstream Provider**:
   - **Supabase Database Password**: Go to **Project Settings > Database > Database password** and click **Reset Database Password**.
   - **Supabase Service Role Key**: Go to **Project Settings > API > JWT Settings** and click **Generate new JWT secret / Roll keys**.
   - **Google Gemini API Key**: Go to **Google AI Studio > API Keys** and delete the exposed key, then generate a replacement.
2. **Step 2: Update Local `.env` Files**:
   - Replace the revoked credentials in `backend/.env` and `ai-engine/.env` with the new values.
3. **Step 3: Remove the Tracked File Without Destroying History**:
   ```bash
   # Remove from Git index while preserving file on disk:
   git rm --cached <path-to-file>
   git commit -m "chore(security): unstage sensitive file and update gitignore"
   ```
4. **Step 4: History Rewriting (Only with Explicit Team Authorization)**:
   Never rewrite Git history (`git filter-branch` or `git filter-repo`) automatically or without explicit coordination, as this rewrites commit SHAs and disrupts collaborators. Upstream credential revocation (Step 1) immediately neutralizes the threat regardless of Git history.

---

## 5. Diagnostic Verification Checklist

Verify your local configuration by running these diagnostic commands:

| Target | Command | Expected Output |
| :--- | :--- | :--- |
| **Supabase Database** | `npm run db:check` | `All 15 Supabase checks passed.` |
| **Prisma Schema** | `cd backend && npx prisma validate` | `The schema at prisma/schema.prisma is valid 🚀` |
| **Backend Health** | `curl -s http://localhost:8000/health \| jq .` | `status: "ok", supabaseApi: "connected"` |
| **AI Engine Health** | `curl -s http://localhost:8001/health \| jq .` | `service: "nyayasaathi-ai-engine", embedding_model_loaded: true` |
| **TypeScript / Build** | `npm run build` | Zero errors; Vite bundles in $<1.5$s |
