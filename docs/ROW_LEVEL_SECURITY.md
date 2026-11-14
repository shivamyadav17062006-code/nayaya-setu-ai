# Row Level Security (RLS) & Access Hardening — NyayaSaathi (न्यायसाथी)

This document details the Row Level Security (RLS) architecture, identity model audit, and policy definitions implemented across all 14 database tables in **Supabase PostgreSQL**.

---

## 1. Authentication Architecture Audit

### Critical Architectural Finding
> [!IMPORTANT]
> **NyayaSaathi utilizes Custom Backend JWT Authentication, NOT Supabase GoTrue Auth.**

- **User Authority**: Citizen accounts are stored in `public.users` with passwords hashed using `bcryptjs`.
- **Token Generation**: When a user registers or logs in via `POST /api/auth/*`, the Express server signs a JWT containing `{ userId, role }` using `JWT_SECRET`.
- **Verification**: The Express middleware [`backend/src/middleware/auth.js`](file:///Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai/backend/src/middleware/auth.js) verifies tokens and attaches the authenticated user to `req.user`.
- **Database Context**: Queries issued by the Express backend run via **Prisma Client** connecting through PostgreSQL connection poolers (`aws-1-ap-northeast-1.pooler.supabase.com`).

### Why `auth.uid()` Cannot Be Used for Application Users
In Supabase, the built-in function `auth.uid()` extracts the `sub` claim from Supabase's internal GoTrue JWTs. Because citizens authenticate via the custom Express backend, **`auth.uid()` resolves to `NULL` for custom JWT callers**.

Assuming `auth.uid()` matches application users would lock out citizens from their own conversations or break application persistence.

---

## 2. Dual-Tier Security Architecture

NyayaSaathi implements defense-in-depth through two complementary layers:

```
[Citizen / Browser Client]
          │
          │ HTTPS + JWT Bearer Token
          ▼
┌────────────────────────────────────────┐
│  Tier 1: Express Server Authorization  │
│  - authenticate / optionalAuth         │
│  - requireAdmin                        │
│  - Zod / express-validator sanitizers  │
│  - Scopes queries by req.user.id       │
└───────────────────┬────────────────────┘
                    │
                    │ TCP (Port 6543 / 5432) via Prisma
                    ▼
┌────────────────────────────────────────┐
│  Tier 2: PostgreSQL Row Level Security │
│  - RLS enabled on all 14 tables        │
│  - PostgREST public read policies      │
│  - Anonymous write prohibitions        │
│  - service_role administrative bypass  │
└────────────────────────────────────────┘
```

---

## 3. RLS Policy Specifications (14 Tables)

### Group 1: Public Read-Only Statutory Knowledge (11 Tables)
These tables store public legal awareness information. Anonymous and authenticated public roles have read-only access. Direct mutations via PostgREST are blocked.

| Table Name | SELECT Policy | INSERT / UPDATE / DELETE Policy |
| :--- | :--- | :--- |
| `legal_acts` | `verification_status = 'VERIFIED'` | `service_role` only |
| `legal_sections` | Allowed (`true`) | `service_role` only |
| `beneficiaries` | Allowed (`true`) | `service_role` only |
| `right_categories` | Allowed (`true`) | `service_role` only |
| `section_beneficiaries`| Allowed (`true`) | `service_role` only |
| `section_categories` | Allowed (`true`) | `service_role` only |
| `complaint_workflows` | Allowed (`true`) | `service_role` only |
| `workflow_steps` | Allowed (`true`) | `service_role` only |
| `legal_aid_providers` | `verified = true OR is_active = true` | `service_role` only |
| `legal_remedies` | Allowed (`true`) | `service_role` only |
| `legal_chunks` | Allowed (`true`) | `service_role` only |

### Group 2: Application Persistence & User Privacy (3 Tables)
These tables hold sensitive citizen profiles and conversational inquiry data.

| Table Name | Policy Strategy | Description |
| :--- | :--- | :--- |
| `users` | Protected | Direct queries via anonymous PostgREST are denied. User accounts are created and authenticated exclusively via server-side Express endpoints using hashed credentials. |
| `conversations` | Session-Scoped | Public clients can insert and select their active session conversation using their unique `sessionId`. Backend links authenticated `userId` on server-side. |
| `messages` | Conversation-Scoped | Messages are inserted and selected by matching `conversation_id`. Backend server-side authorization ensures isolation. |

---

## 4. Administrative Authorization

- **Admin Endpoints**: Protected at the server layer using `requireAdmin` middleware.
- **Service Role Secret**: `SUPABASE_SERVICE_ROLE_KEY` is loaded strictly from environment variables and is never exposed in client-side bundles or repository commits.
