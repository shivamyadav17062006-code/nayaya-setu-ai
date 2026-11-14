# Database Verification & Integrity Audit — NyayaSaathi (न्यायसाथी)

This report details the automated verification of the 14 baseline database tables, constraints, foreign keys, indexes, and pgvector functions in **Supabase PostgreSQL**.

---

## 1. Automated Verification Audit Script

The canonical verification script is located at [`supabase/verify_schema.sql`](file:///Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai/supabase/verify_schema.sql). It performs an end-to-end relational audit across the database catalogue.

To run verification against the live database:
```bash
node -e "
import fs from 'fs';
import('./backend/src/lib/prisma.js').then(async ({ prisma }) => {
  const sql = fs.readFileSync('./supabase/verify_schema.sql', 'utf8');
  await prisma.\$executeRawUnsafe(sql);
  console.log('✅ verify_schema.sql executed successfully without errors!');
  await prisma.\$disconnect();
});
"
```

---

## 2. Table Existence & Primary Key Verification

All 14 baseline tables are verified present in the `public` schema with explicit primary keys:

| Table Name | Primary Key Column | Type | Status |
| :--- | :--- | :--- | :--- |
| `legal_acts` | `id` | `UUID` | ✓ Verified |
| `legal_sections` | `id` | `UUID` | ✓ Verified |
| `beneficiaries` | `id` | `UUID` | ✓ Verified |
| `right_categories` | `id` | `UUID` | ✓ Verified |
| `section_beneficiaries`| `section_id, beneficiary_id` | Compound `UUID` | ✓ Verified |
| `section_categories` | `section_id, category_id` | Compound `UUID` | ✓ Verified |
| `complaint_workflows` | `id` | `UUID` | ✓ Verified |
| `workflow_steps` | `id` | `UUID` | ✓ Verified |
| `legal_aid_providers` | `id` | `UUID` | ✓ Verified |
| `legal_remedies` | `id` | `UUID` | ✓ Verified |
| `legal_chunks` | `id` | `UUID` | ✓ Verified |
| `users` | `id` | `UUID` | ✓ Verified |
| `conversations` | `id` | `UUID` | ✓ Verified |
| `messages` | `id` | `UUID` | ✓ Verified |

---

## 3. Foreign Key Referential Integrity Results

Every foreign key relationship is verified against PostgreSQL information schema:

| Source Table | Source Column | Target Table | Target Column | `ON DELETE` Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `legal_sections` | `act_id` | `legal_acts` | `id` | `CASCADE` | ✓ Verified |
| `section_beneficiaries`| `section_id` | `legal_sections` | `id` | `CASCADE` | ✓ Verified |
| `section_beneficiaries`| `beneficiary_id`| `beneficiaries` | `id` | `CASCADE` | ✓ Verified |
| `section_categories` | `section_id` | `legal_sections` | `id` | `CASCADE` | ✓ Verified |
| `section_categories` | `category_id` | `right_categories`| `id` | `CASCADE` | ✓ Verified |
| `complaint_workflows` | `category_id` | `right_categories`| `id` | `SET NULL` | ✓ Verified |
| `workflow_steps` | `workflow_id` | `complaint_workflows` | `id` | `CASCADE` | ✓ Verified |
| `legal_remedies` | `section_id` | `legal_sections` | `id` | `CASCADE` | ✓ Verified |
| `legal_chunks` | `section_id` | `legal_sections` | `id` | `CASCADE` | ✓ Verified |
| `conversations` | `user_id` | `users` | `id` | `SET NULL` | ✓ Verified |
| `messages` | `conversation_id` | `conversations` | `id` | `CASCADE` | ✓ Verified |

---

## 4. Unique Constraints Audit

The following unique constraints protect identity and prevent duplicate statutory or session data:

| Table Name | Constraint Name | Columns | Status |
| :--- | :--- | :--- | :--- |
| `beneficiaries` | `beneficiaries_name_key` | `name` | ✓ Verified |
| `beneficiaries` | `beneficiaries_slug_key` | `slug` | ✓ Verified |
| `right_categories` | `right_categories_name_key` | `name` | ✓ Verified |
| `right_categories` | `right_categories_slug_key` | `slug` | ✓ Verified |
| `legal_sections` | `legal_sections_act_id_section_number_key` | `act_id, section_number` | ✓ Verified |
| `workflow_steps` | `workflow_steps_workflow_id_step_number_key`| `workflow_id, step_number` | ✓ Verified |
| `legal_chunks` | `legal_chunks_section_chunk_language_key` | `section_id, chunk_number, language` | ✓ Verified |
| `users` | `users_email_key` | `email` | ✓ Verified |
| `users` | `users_phone_key` | `phone` | ✓ Verified |
| `conversations` | `conversations_session_id_key` | `session_id` | ✓ Verified |

---

## 5. Vector Cosine Index & RPC Function Audit

- **Vector Extension**: `vector` (pgvector 0.5.0+) active in PostgreSQL database.
- **HNSW Index**: `legal_chunks_embedding_idx` verified on `legal_chunks(embedding vector_cosine_ops)`.
- **RPC Function**: `match_legal_chunks(query_embedding vector(384), match_count int, min_similarity float)` is callable by `anon`, `authenticated`, and `service_role`.

---

## 6. Prisma ORM Validation Suite

All verification tools pass with exit code 0:

```bash
# 1. Prisma Schema Validation
npx prisma validate
# Output: The schema at prisma/schema.prisma is valid 🚀

# 2. Prisma Client Generation
npx prisma generate
# Output: ✔ Generated Prisma Client (v5.22.0)

# 3. Supabase Live Checker
npm run db:check
# Output: All Supabase checks passed (14 tables + pgvector RPC)
```
