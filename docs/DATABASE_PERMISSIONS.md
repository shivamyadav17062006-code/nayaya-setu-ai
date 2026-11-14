# Database Roles & Permissions Matrix — NyayaSaathi (न्यायसाथी)

This document outlines the database role privileges, execution rights, and credential isolation boundaries in **Supabase PostgreSQL**.

---

## 1. Database Role Hierarchy

```
┌───────────────────────────────────────────────────────────────┐
│                    POSTGRESQL ROLES                           │
├─────────────────┬─────────────────────────────────────────────┤
│ 1. postgres     │ Superuser / connection owner used by Prisma │
│                 │ Client for backend operations.              │
├─────────────────┼─────────────────────────────────────────────┤
│ 2. service_role │ Administrative API role. Bypasses RLS for   │
│                 │ ingestion, migrations, and background jobs. │
├─────────────────┼─────────────────────────────────────────────┤
│ 3. anon         │ Public unauthenticated role used by browser │
│                 │ clients and external REST callers.          │
├─────────────────┼─────────────────────────────────────────────┤
│ 4. authenticated│ Registered user role for PostgREST calls.   │
└─────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Table Access Permissions Matrix

| Table Name | `anon` Role | `authenticated` Role | `service_role` Role | `postgres` (Prisma) |
| :--- | :--- | :--- | :--- | :--- |
| `legal_acts` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `legal_sections` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `beneficiaries` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `right_categories` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `section_beneficiaries`| `SELECT` | `SELECT` | `ALL` | `ALL` |
| `section_categories` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `complaint_workflows` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `workflow_steps` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `legal_aid_providers` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `legal_remedies` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `legal_chunks` | `SELECT` | `SELECT` | `ALL` | `ALL` |
| `users` | *None* | *None* | `ALL` | `ALL` |
| `conversations` | `SELECT`, `INSERT` | `SELECT`, `INSERT` | `ALL` | `ALL` |
| `messages` | `SELECT`, `INSERT` | `SELECT`, `INSERT` | `ALL` | `ALL` |

---

## 3. Stored Procedure & Function Execution Rights

### `match_legal_chunks(vector, int, float)`
- **`GRANT EXECUTE`**: `anon`, `authenticated`, `service_role`.
- **Purpose**: Allows both anonymous citizens and authenticated paralegals to execute read-only semantic vector searches against verified statutory provisions.

---

## 4. Credential Isolation & Least Privilege Rules

1. **Browser / Frontend Exposure**:
   - Only `SUPABASE_ANON_KEY` (public publishable key) and `VITE_API_URL` are permitted in frontend bundles.
   - `SUPABASE_ANON_KEY` cannot mutate statutory law or read sensitive user tables directly.
2. **Server-Side Secrets**:
   - `DATABASE_URL` (database password) and `SUPABASE_SERVICE_ROLE_KEY` are stored strictly in `backend/.env`.
   - Never committed to source control or exposed in API response bodies.
3. **Cache Invalidation**:
   - PostgREST schema cache must be reloaded after permission changes:
     ```sql
     NOTIFY pgrst, 'reload schema';
     ```
