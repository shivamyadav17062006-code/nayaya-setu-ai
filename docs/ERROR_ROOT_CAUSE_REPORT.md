# NyayaSaathi (न्यायसाथी) — Error Root Cause Audit Report

**Audit Scope:** Deep-dive forensic analysis of all 10 historical runtime errors.  
**Objective:** Document exact file paths, line numbers, failure mechanisms, and permanent architectural resolutions.

---

## Error 1: Prisma Invalid Database String

- **Symptom / Stack Trace:**
  ```text
  Invalid prisma.conversation.findUnique() invocation:
  The provided database string is invalid.
  Error parsing connection string: invalid domain character in database URL.
  ```
- **File Responsible:** `backend/.env` (line 7) and `backend/.env.example` (line 7).
- **Exact Line:**
  ```env
  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.rmbfcfigiuyspsdutzov.supabase.co:5432/postgres"
  ```
- **Failure Mechanism:** Under RFC 3986, square brackets `[` and `]` are reserved characters. When the userinfo portion of the URI contains literal brackets (`[YOUR-PASSWORD]`), the URL parser in Prisma's query engine rejects the entire connection string as malformed before attempting a network socket connection.
- **Permanent Resolution:**
  1. Implemented `isPlaceholderConnectionUrl()` in `backend/src/lib/prisma.ts` to detect unconfigured placeholder strings before passing them to Prisma.
  2. Updated `.env.example` files to document clear, bracket-free URL formats with explicit URL-encoding instructions.

---

## Error 2: Invalid Database URL Domain

- **Symptom / Stack Trace:**
  ```text
  Error parsing connection string: invalid domain character in database URL.
  ```
- **File Responsible:** `backend/.env` and root `.env`.
- **Exact Line:**
  ```env
  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.rmbfcfigiuyspsdutzov.supabase.co:5432/postgres"
  ```
- **Failure Mechanism:** The presence of the unescaped `@` delimiter coupled with bracket characters caused the URI parser to misidentify the domain boundary, attempting to parse `[YOUR-PASSWORD]@db...` as host tokens.
- **Permanent Resolution:**
  Separated connection string configuration into **Session Pooler** (`aws-0-[region].pooler.supabase.com:5432`) for application queries and **Direct URL** (`db.[project-ref].supabase.co:5432`) for Prisma migrations.

---

## Error 3: Supabase Direct Database Connection Refused

- **Symptom / Stack Trace:**
  ```text
  Can't reach database server at db.rmbfcfigiuyspsdutzov.supabase.co:5432
  [Errno 8] nodename nor servname provided, or not known
  ```
- **File Responsible:** Remote DNS configuration for `db.rmbfcfigiuyspsdutzov.supabase.co` referenced in `backend/.env` and `ai-engine/.env`.
- **Failure Mechanism:**
  - Running `dig db.rmbfcfigiuyspsdutzov.supabase.co A +short` returns **no IPv4 address**.
  - Running `dig db.rmbfcfigiuyspsdutzov.supabase.co AAAA +short` returns `2406:da14:25a:5800:0:e34f:cd0d:6d96` (IPv6 only).
  - Development machines and local ISP networks that lack an end-to-end IPv6 gateway cannot resolve or route to IPv6 hosts, causing TCP SYN timeouts and `ECONNREFUSED`.
- **Permanent Resolution:**
  Use the Supabase Session Pooler host (`aws-0-[region].pooler.supabase.com:5432`). The pooler endpoints are dual-stack and provide public IPv4 addresses (`65.0.195.55`, `3.111.105.85`).

---

## Error 4: Missing `legal_acts` and Related Tables

- **Symptom / Stack Trace:**
  ```text
  PGRST205: Could not find the table 'public.legal_acts' in the schema cache
  ```
- **File Responsible:** Remote Supabase instance state & `backend/scripts/checkSupabase.ts` (lines 15–45).
- **Failure Mechanism:** The remote Supabase PostgreSQL database had not executed `supabase/schema.sql`. PostgREST inspects PostgreSQL's information schema; when a requested table is absent from `public`, PostgREST returns error `PGRST205`.
- **Permanent Resolution:**
  Executed the aligned `supabase/schema.sql` in Supabase SQL Editor and reloaded the PostgREST schema cache via `NOTIFY pgrst, 'reload schema';`. All 10 statutory tables verified green in `npm run db:check`.

---

## Error 5: Missing Application Persistence Tables

- **Symptom / Stack Trace:**
  ```text
  PGRST205: Could not find the table 'public.users' in the schema cache
  PGRST205: Could not find the table 'public.conversations' in the schema cache
  PGRST205: Could not find the table 'public.messages' in the schema cache
  ```
- **File Responsible:** Original `supabase/schema.sql` (omitted application tables).
- **Failure Mechanism:** The initial schema author only created statutory knowledge tables, assuming Prisma would create application tables. But Prisma migrations had not been applied to Supabase, resulting in missing persistence tables.
- **Permanent Resolution:**
  Authored migration `supabase/migrations/20261114000000_schema_alignment_and_persistence.sql`, establishing 14 unified tables in PostgreSQL and mirroring them in Prisma schema using `@@map` and `@map`.

---

## Error 6: Missing `match_legal_chunks` RPC

- **Symptom / Stack Trace:**
  ```text
  Could not find the function public.match_legal_chunks(match_count, min_similarity, query_embedding) in the schema cache
  ```
- **File Responsible:** `supabase/schema.sql` (lines 215–247) & `backend/scripts/checkSupabase.ts` (lines 50–65).
- **Failure Mechanism:**
  1. The `pgvector` extension had not been activated in the database.
  2. The function signature expected `vector(384)`, but without the extension, PostgreSQL rejected function creation.
  3. API roles (`anon`, `authenticated`) lacked execution grants on the stored procedure.
- **Permanent Resolution:**
  Added `CREATE EXTENSION IF NOT EXISTS vector;` and granted execute permissions:
  ```sql
  GRANT EXECUTE ON FUNCTION match_legal_chunks(vector, integer, double precision)
  TO anon, authenticated, service_role;
  ```

---

## Error 7: AI Engine ECONNREFUSED on Port 8001

- **Symptom / Stack Trace:**
  ```text
  AI Engine unavailable:
  connect ECONNREFUSED 127.0.0.1:8001
  connect ECONNREFUSED ::1:8001
  ```
- **File Responsible:** `package.json` (line 12), `backend/src/index.ts` (line 22), and missing dependencies in `ai-engine/venv`.
- **Failure Mechanism:**
  1. The default development command `npm run dev` only spawned backend and frontend, omitting the AI engine entirely.
  2. `backend/src/index.ts` had a bug defaulting `AI_ENGINE_URL` to `http://localhost:8000` (the backend itself).
  3. In `ai-engine/venv`, SQLAlchemy asyncio threw `ImportError: The SQLAlchemy asyncio module requires that the Python 'greenlet' library is installed.` preventing FastAPI from starting.
  4. On Node 18+, `localhost` resolves to `::1` before `127.0.0.1`, printing duplicate connection refused errors.
- **Permanent Resolution:**
  1. Installed `greenlet` in `ai-engine/venv`.
  2. Corrected default `AI_ENGINE_URL` to `http://localhost:8001`.
  3. Updated root `package.json` to start all three services together with process cleanup (`concurrently -k`).

---

## Error 8: Gemini API Key Invalid

- **Symptom / Stack Trace:**
  ```text
  Gemini direct call failed:
  API key not valid. Please pass a valid API key.
  ```
- **File Responsible:** `backend/src/services/aiService.ts` (line 26), `ai-engine/app/services/llm_service.py` (line 189), and `backend/.env` (line 24).
- **Failure Mechanism:** The `.env` file contained the literal string `GEMINI_API_KEY=your-gemini-api-key`. Both TypeScript and Python services evaluated `if (GEMINI_API_KEY)` as truthy and made outbound HTTPS calls to `generativelanguage.googleapis.com`, which rejected the placeholder.
- **Permanent Resolution:**
  Added `sanitizeApiKey()` in both backend and AI engine to recognize and filter out dummy values (`your-*`, `[YOUR-*]`, length $<15$), preventing failed outbound requests and avoiding error spam.

---

## Error 9: Chat Session Logging Skipped

- **Symptom / Stack Trace:**
  ```text
  DB session logging skipped (DB offline): The provided database string is invalid.
  ```
- **File Responsible:** `backend/src/controllers/chatController.ts` (lines 31–69).
- **Failure Mechanism:** Whenever Prisma threw a connection string error, the catch block swallowed the error with a simple `console.warn`, allowing the chat request to continue without recording conversation history.
- **Permanent Resolution:**
  1. Created `backend/src/lib/prisma.ts` singleton with `isPrismaConfigured` check.
  2. Differentiated database session logging from AI generation.
  3. Structured the response to return diagnostic status (`engine: 'ai-engine-rag'`, `degraded: true`).

---

## Error 10: Root Development Scripts Not Starting All Services

- **Symptom / Stack Trace:**
  Developers ran `npm run dev`, expecting the entire platform to work, but chat failed because the AI engine was not running.
- **File Responsible:** `package.json` (lines 11–20).
- **Failure Mechanism:**
  ```json
  "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
  "dev:full": "concurrently \"npm run dev:ai\" \"npm run dev\""
  ```
  `dev` omitted `dev:ai`. Furthermore, `concurrently` was executed without `--kill-others` (`-k`), so terminating the process in the terminal left child processes orphaned on port 8000 or 8001.
- **Permanent Resolution:**
  Updated `package.json`:
  ```json
  "dev": "npm run dev:full",
  "dev:full": "concurrently -k -p \"[{name}]\" -n \"AI,BACKEND,FRONTEND\" -c \"magenta,blue,green\" \"npm run dev:ai\" \"npm run dev:backend\" \"npm run dev:frontend\""
  ```
