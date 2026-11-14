# AGENTS.md — NyayaSaathi (न्यायसाथी) Permanent Project Rules

This document establishes the mandatory architectural, linguistic, and operational rules for all AI agents, engineers, and contributors working on the **NyayaSaathi** repository.

---

## 1. Primary Implementation Language: JavaScript
- **JavaScript is the official and preferred implementation language** of this project.
- The project is standardizing on modern **JavaScript ES Modules (`import`/`export`)**.
- Use `.js` and `.jsx` for all new application code across the frontend, backend, and AI service layers.
- Avoid introducing new TypeScript syntax or configurations for new code. Existing TypeScript files will be migrated incrementally to JavaScript.

## 2. No New Python or FastAPI Implementations
- **Strictly prohibit introducing new Python files, FastAPI endpoints, or Python microservices.**
- All AI workflows, RAG pipelines, text embeddings, and LLM integrations must be implemented in **Node.js/JavaScript**.
- The existing `ai-engine/` Python implementation is retained only as an audit reference and feature baseline. It will be retired once its capabilities (vector search, multilingual prompt templates, and intent routing) are completely ported to Node.js.

## 3. Official Google Gemini JavaScript SDK
- All LLM interactions must use Google's official JavaScript SDK (`@google/genai` or `@google/generative-ai`).
- Load credentials strictly from server-side environment variables (`GEMINI_API_KEY` or `GOOGLE_API_KEY`).
- Never expose API keys or service role keys to the frontend or browser bundles.

## 4. Single Source of Truth: Supabase PostgreSQL & pgvector
- The database schema is owned by **PostgreSQL in Supabase** (`supabase/schema.sql` and `supabase/migrations/`).
- Vector similarity search runs directly in PostgreSQL via the **`pgvector` extension** and the `match_legal_chunks` RPC function.
- Node.js backend services query Supabase using `@supabase/supabase-js` and the JavaScript Prisma Client.

## 5. Incremental & Non-Destructive Migration
- Migrate code incrementally: do not perform wholesale rewrites that break existing features.
- Preserve working functionality at every step.
- **Never execute destructive database operations** (`DROP TABLE`, `prisma migrate reset`, truncate, or data wiping).
- Maintain backward compatibility with existing Supabase tables, columns, and foreign keys.

## 6. Zero Legal Hallucinations & Grounded Citations
- NyayaSaathi is a Know Your Rights (KYR) public platform. **Never fabricate legal sections, Act names, penalties, or procedures.**
- Ground all legal advice strictly in verified Indian statutes (Payment of Wages Act 1936, PWDVA 2005, Consumer Protection Act 2019, Legal Services Authorities Act 1987, Constitution of India).
- If statutory data or embeddings are not available for a specific query, state this transparently to the user; do not invent fictional citations.

## 7. Explicit Fallback Disclaimers
- Never present canned or mock responses as live AI-generated analysis.
- When running in degraded or offline mode, responses must be explicitly flagged with `degraded: true` and an informative disclaimer.
- Always include the statutory legal awareness disclaimer directing citizens to NALSA (Helpline **15100**) or local DLSAs for formal court representation.

## 8. Secrets & Environment Isolation
- Never commit `.env` files, API keys, database passwords, or private certificates.
- Standardize on `.env.example` templates for configuration documentation.
- Database passwords with reserved characters must always be URL-encoded.
- Never use the Supabase Publishable/Anon key as a database password.

## 9. Modern Testing Standard
- Standardize on:
  - **Vitest** for unit and integration testing.
  - **Supertest** for Express API route testing.
  - **Playwright** for end-to-end browser testing.
- Always run automated tests and schema validations before reporting a task as complete.

## 10. Phased Execution & Git Hygiene
- Modify only the files and scopes requested for the current phase.
- Never run automatic `git commit` or `git push` commands.
- Keep the working tree clean, exclude temporary CLI states (`supabase/.temp/`), and document all modified files and verification results.
