# Connecting NyayaSaathi with Supabase (PostgreSQL + pgvector)

This guide walks you through connecting your Supabase project to the **NyayaSaathi** application.

---

## 📋 Step 1: Open Supabase SQL Editor

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Open [`supabase/schema.sql`](./schema.sql), copy the entire file content, and paste it into the editor.
5. Click **Run** (or `Cmd + Enter` / `Ctrl + Enter`).

This single script executes:
- ✅ Enables `pgvector` and `uuid-ossp` extensions.
- ✅ Creates all 10 relational tables:
  1. `legal_acts`
  2. `legal_sections`
  3. `beneficiaries`
  4. `right_categories`
  5. `section_beneficiaries`
  6. `section_categories`
  7. `complaint_workflows`
  8. `workflow_steps`
  9. `legal_aid_providers`
  10. `legal_chunks` (with 384-dim vector embeddings)
- ✅ Creates HNSW vector index (`legal_chunks_embedding_idx`) for fast cosine similarity search.
- ✅ Adds a unique `(section_id, chunk_number, language)` index so chunk ingestion can upsert safely.
- ✅ Creates the `match_legal_chunks(query_embedding, match_count, min_similarity)` RPC, which joins
  `legal_chunks → legal_sections → legal_acts` and returns act/section metadata plus category names.
- ✅ Configures Row Level Security (RLS) policies for secure public reading and backend admin access.
- ✅ Seeds verified Indian statutes (Payment of Wages Act 1936, PWDVA 2005, Consumer Protection Act 2019, Minimum Wages Act 1948, RTE Act 2009) and the NALSA/SLSA directory with fixed ids.

> **Security:** the `service_role` key bypasses RLS. Keep it only in
> `backend/.env` and `ai-engine/.env` — never in the frontend or in git.

---

## 🔑 Step 2: Copy Your Supabase Credentials

In your Supabase project dashboard:
1. Go to **Project Settings** > **API**:
   - Copy **Project URL** (`https://<project-ref>.supabase.co`)
   - Copy **anon public** key
   - Copy **service_role secret** key (keep confidential)
2. Go to **Project Settings** > **Database**:
   - Copy the **Connection string** (URI) under Session pooler or Direct connection.

---

## ⚙️ Step 3: Add Credentials to `.env`

In your `backend/.env` file:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

In your `ai-engine/.env` file:
```env
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LLM_PROVIDER=google
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

If you only use the REST/RPC path (no direct SQL), `DATABASE_URL` can point at a
local PostgreSQL; health will report the database as degraded while vector
retrieval still works through `SUPABASE_URL`.

---

## 🧪 Step 4: Verify Your Tables

Run this query in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```
You should see all 10 tables with `rowsecurity = true`.

---

## 🧠 Step 5: Generate & Store AI Embeddings

Run the embedding generator in `ai-engine/`:
```bash
cd ai-engine
python embedding.py          # embeds every seeded legal section
python embedding.py --force  # re-embeds sections that already have chunks
```
It reads `legal_sections` (act title, section number/title, original and
simplified text), generates 384-dimensional embeddings with the multilingual
`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` model, and
upserts into `legal_chunks` on `(section_id, chunk_number, language)`.

Verify retrieval from the AI engine:
```bash
curl "http://localhost:8001/search?q=salary+not+paid" | python -m json.tool
```

If `results` is empty, confirm that `legal_chunks` has rows with a non-null
`embedding` and that the model in `.env` matches the `vector(384)` column.
