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
- ✅ Creates `match_legal_chunks()` PostgreSQL function for AI RAG retrieval.
- ✅ Configures Row Level Security (RLS) policies for secure public reading and backend admin access.
- ✅ Seeds verified Indian statutes (Payment of Wages Act 1936, PWDVA 2005, Consumer Protection Act 2019, Minimum Wages Act 1948, RTE Act 2009).

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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

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
python embedding.py
```
This generates real 384-dimensional embeddings using `sentence-transformers/all-MiniLM-L6-v2` and inserts them into your Supabase `legal_chunks` table!
