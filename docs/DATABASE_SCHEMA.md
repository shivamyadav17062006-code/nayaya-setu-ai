# Database Schema Specification — NyayaSaathi (न्यायसाथी)

This document provides the definitive architectural specification for the 14 baseline relational tables in **NyayaSaathi**. The database is owned by **Supabase PostgreSQL 15+** with the **`pgvector`** extension, mapped to **Prisma Client (JS)** as the application ORM.

---

## 1. Architectural Overview & Domain Breakdown

The schema is divided into four distinct architectural domains:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NYAYASAATHI DATABASE                            │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. Statutory Knowledge   │ legal_acts, legal_sections, beneficiaries,  │
│    Graph (6 Tables)      │ right_categories, section_beneficiaries,    │
│                          │ section_categories                          │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 2. Legal Remedies &      │ complaint_workflows, workflow_steps,        │
│    Aid (4 Tables)        │ legal_aid_providers, legal_remedies         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. AI Vector Retrieval   │ legal_chunks (vector(384) HNSW Index)       │
│    (1 Table)             │                                             │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 4. Application           │ users, conversations, messages              │
│    Persistence (3 Tables)│                                             │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Statutory Knowledge Graph Domain

### 2.1 `legal_acts`
Primary container for verified Indian statutes and legislation.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `title` | `TEXT` | No | — | Official title of the Act |
| `act_number` | `TEXT` | Yes | `NULL` | Formal Act number (e.g. 'Act No. 4 of 1936') |
| `year` | `INT` | No | — | Year of enactment |
| `jurisdiction` | `TEXT` | No | — | 'CENTRAL' or 'STATE' |
| `state` | `TEXT` | Yes | `NULL` | Applicable state if jurisdiction is 'STATE' |
| `category` | `TEXT` | Yes | `NULL` | Primary legal category code (e.g. 'LABOUR') |
| `description` | `TEXT` | Yes | `NULL` | Statutory overview |
| `source_url` | `TEXT` | No | — | India Code or official gazette URL |
| `status` | `TEXT` | Yes | `'ACTIVE'` | 'ACTIVE', 'REPEALED', 'AMENDED' |
| `effective_from` | `DATE` | Yes | `NULL` | Date law came into force |
| `effective_to` | `DATE` | Yes | `NULL` | Sunset or repeal date |
| `verification_status`| `TEXT` | Yes | `'PENDING'` | 'PENDING', 'VERIFIED', 'NEEDS_REVIEW' |
| `last_verified_at` | `TIMESTAMPTZ`| Yes | `NULL` | Legal audit timestamp |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Indexes**:
- `legal_acts_pkey` (PRIMARY KEY, btree `id`)
- `legal_acts_title_idx` (btree `title`)
- `legal_acts_category_idx` (btree `category`)
- `legal_acts_verification_status_idx` (btree `verification_status`)

---

### 2.2 `legal_sections`
Individual statutory provisions and sections within an Act.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `act_id` | `UUID` | No | — | Foreign Key -> `legal_acts(id)` ON DELETE CASCADE |
| `section_number`| `TEXT` | No | — | Section identifier (e.g. 'Section 5') |
| `section_title` | `TEXT` | Yes | `NULL` | Title or marginal heading |
| `original_text` | `TEXT` | No | — | Verbatim statutory language |
| `simplified_text`| `TEXT` | Yes | `NULL` | Accessible citizen summary (Plain language) |
| `effective_from`| `DATE` | Yes | `NULL` | Provision in-force date |
| `effective_to` | `DATE` | Yes | `NULL` | Provision sunset date |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Constraints & Indexes**:
- `legal_sections_pkey` (PRIMARY KEY, btree `id`)
- `legal_sections_act_id_section_number_key` (UNIQUE, btree `act_id, section_number`)
- `legal_sections_act_id_idx` (btree `act_id`)
- `legal_sections_section_number_idx` (btree `section_number`)

---

### 2.3 `beneficiaries`
Protected target demographics (e.g., Women, Children, Senior Citizens, Industrial Workers).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `TEXT` | No | — | Demographic name (e.g. 'Women') |
| `slug` | `TEXT` | No | — | URL-safe slug (e.g. 'women') |
| `description` | `TEXT` | Yes | `NULL` | Scope of demographic entitlement |
| `icon` | `TEXT` | Yes | `NULL` | Lucide icon identifier |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Constraints & Indexes**:
- `beneficiaries_pkey` (PRIMARY KEY, btree `id`)
- `beneficiaries_name_key` (UNIQUE, btree `name`)
- `beneficiaries_slug_key` (UNIQUE, btree `slug`)
- `beneficiaries_slug_idx` (btree `slug`)

---

### 2.4 `right_categories`
Top-level legal domains (e.g. Labour Rights, Consumer Rights, Constitutional Rights).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `TEXT` | No | — | Category name (e.g. 'Labour Rights') |
| `slug` | `TEXT` | No | — | Canonical URL slug (e.g. 'labour') |
| `description` | `TEXT` | Yes | `NULL` | Scope description |
| `icon` | `TEXT` | Yes | `NULL` | Lucide icon identifier |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Constraints & Indexes**:
- `right_categories_pkey` (PRIMARY KEY, btree `id`)
- `right_categories_name_key` (UNIQUE, btree `name`)
- `right_categories_slug_key` (UNIQUE, btree `slug`)
- `right_categories_slug_idx` (btree `slug`)

---

### 2.5 `section_beneficiaries`
Many-to-many junction table mapping legal sections to target beneficiaries.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `section_id` | `UUID` | No | — | Foreign Key -> `legal_sections(id)` ON DELETE CASCADE |
| `beneficiary_id`| `UUID` | No | — | Foreign Key -> `beneficiaries(id)` ON DELETE CASCADE |

**Constraints & Indexes**:
- `section_beneficiaries_pkey` (PRIMARY KEY, `section_id, beneficiary_id`)
- `section_beneficiaries_section_id_idx` (btree `section_id`)
- `section_beneficiaries_beneficiary_id_idx` (btree `beneficiary_id`)

---

### 2.6 `section_categories`
Many-to-many junction table mapping legal sections to right categories.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `section_id` | `UUID` | No | — | Foreign Key -> `legal_sections(id)` ON DELETE CASCADE |
| `category_id` | `UUID` | No | — | Foreign Key -> `right_categories(id)` ON DELETE CASCADE |

**Constraints & Indexes**:
- `section_categories_pkey` (PRIMARY KEY, `section_id, category_id`)
- `section_categories_section_id_idx` (btree `section_id`)
- `section_categories_category_id_idx` (btree `category_id`)

---

## 3. Legal Remedies & Workflows Domain

### 3.1 `complaint_workflows`
Standard operating legal procedures for filing grievances and claims.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `title` | `TEXT` | No | — | Name of procedure |
| `description` | `TEXT` | Yes | `NULL` | Detailed explanation of workflow |
| `category` | `TEXT` | Yes | `NULL` | Category code (e.g. 'LABOUR') |
| `category_id` | `UUID` | Yes | `NULL` | Foreign Key -> `right_categories(id)` ON DELETE SET NULL |
| `jurisdiction` | `TEXT` | Yes | `'BOTH'` | 'CENTRAL', 'STATE', 'BOTH' |
| `state` | `TEXT` | Yes | `NULL` | State boundary filter |
| `target_authority`| `TEXT` | Yes | `NULL` | Official forum (e.g. 'Labour Commissioner') |
| `official_url` | `TEXT` | Yes | `NULL` | Government e-filing portal |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Indexes**:
- `complaint_workflows_pkey` (PRIMARY KEY, btree `id`)
- `complaint_workflows_category_id_idx` (btree `category_id`)
- `complaint_workflows_category_idx` (btree `category`)

---

### 3.2 `workflow_steps`
Sequential actionable instructions for a complaint workflow.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `workflow_id` | `UUID` | No | — | Foreign Key -> `complaint_workflows(id)` ON DELETE CASCADE |
| `step_number` | `INT` | No | — | Ordinal execution step (1, 2, 3...) |
| `title` | `TEXT` | No | — | Step action title |
| `instructions` | `TEXT` | Yes | `NULL` | Step-by-step guidance |
| `description` | `TEXT` | Yes | `NULL` | Extended explanation |
| `authority` | `TEXT` | Yes | `NULL` | Office or desk handling this step |
| `required_documents`| `TEXT[]`| Yes | `'{}'` | Documents checklist |
| `documents` | `TEXT[]`| Yes | `'{}'` | Supporting documents |
| `official_url` | `TEXT` | Yes | `NULL` | Step-specific portal |
| `time_limit` | `TEXT` | Yes | `NULL` | Statutory response limit (e.g. '15 days') |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Constraints & Indexes**:
- `workflow_steps_pkey` (PRIMARY KEY, btree `id`)
- `workflow_steps_workflow_id_step_number_key` (UNIQUE, btree `workflow_id, step_number`)
- `workflow_steps_workflow_id_idx` (btree `workflow_id`)

---

### 3.3 `legal_aid_providers`
Public institutional legal services (NALSA, SLSA, DLSA, Taluk Legal Services Committees).

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `TEXT` | No | — | Authority name |
| `provider_type` | `TEXT` | No | — | 'NALSA', 'SLSA', 'DLSA', 'TLSC', 'NGO', 'OTHER' |
| `state` | `TEXT` | Yes | `NULL` | State jurisdiction |
| `district` | `TEXT` | Yes | `NULL` | District administrative area |
| `address` | `TEXT` | Yes | `NULL` | Physical address |
| `phone` | `TEXT` | Yes | `NULL` | Helpline / landline phone number |
| `email` | `TEXT` | Yes | `NULL` | Official email address |
| `website` | `TEXT` | Yes | `NULL` | Web portal |
| `eligibility_information`| `TEXT`| Yes | `NULL` | Free legal aid entitlement criteria (Sec 12) |
| `services` | `TEXT[]`| Yes | `'{}'` | Services offered |
| `is_active` | `BOOLEAN` | Yes | `TRUE` | Operational flag |
| `verified` | `BOOLEAN` | Yes | `FALSE` | Official verification flag |
| `last_verified_at`| `TIMESTAMPTZ`| Yes | `NULL` | Last verification timestamp |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Indexes**:
- `legal_aid_providers_pkey` (PRIMARY KEY, btree `id`)
- `legal_aid_providers_state_idx` (btree `state`)
- `legal_aid_providers_district_idx` (btree `district`)
- `legal_aid_providers_type_idx` (btree `provider_type`)

---

### 3.4 `legal_remedies`
Specific legal actions and redressal mechanisms associated with a statutory section.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `section_id` | `UUID` | No | — | Foreign Key -> `legal_sections(id)` ON DELETE CASCADE |
| `remedy_type` | `TEXT` | No | — | 'COMPLAINT', 'COURT', 'TRIBUNAL', 'AUTHORITY' |
| `title` | `TEXT` | No | — | Title of remedy |
| `description` | `TEXT` | No | — | Actionable rights remedy |
| `authority` | `TEXT` | Yes | `NULL` | Adjudicating body |
| `contact_info` | `TEXT` | Yes | `NULL` | Filing office contact |
| `time_limit` | `TEXT` | Yes | `NULL` | Limitation period |
| `official_url` | `TEXT` | Yes | `NULL` | Online redressal portal |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Indexes**:
- `legal_remedies_pkey` (PRIMARY KEY, btree `id`)
- `legal_remedies_section_id_idx` (btree `section_id`)

---

## 4. AI Vector Retrieval Domain

### 4.1 `legal_chunks`
Vectorized text passages derived from legal sections, used for semantic RAG search via `pgvector`.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `section_id` | `UUID` | Yes | `NULL` | Foreign Key -> `legal_sections(id)` ON DELETE CASCADE |
| `content` | `TEXT` | No | — | Grounded statutory text passage |
| `chunk_number` | `INT` | No | `1` | Sequential chunk index |
| `language` | `TEXT` | Yes | `'en'` | ISO 639-1 language code |
| `source_url` | `TEXT` | Yes | `NULL` | Verified source URL |
| `embedding` | `vector(384)`| Yes | `NULL` | 384-dimensional MiniLM embedding vector |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Indexes & Search Functions**:
- `legal_chunks_pkey` (PRIMARY KEY, btree `id`)
- `legal_chunks_embedding_idx` (HNSW on `embedding vector_cosine_ops`)
- `legal_chunks_section_chunk_language_key` (UNIQUE, btree `section_id, chunk_number, language`)
- `legal_chunks_section_id_idx` (btree `section_id`)
- **RPC Function**: `match_legal_chunks(query_embedding vector(384), match_count int, min_similarity float)`

---

## 5. Application Persistence Domain

### 5.1 `users`
Citizen and paralegal user accounts.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `email` | `TEXT` | Yes | `NULL` | Unique email address |
| `phone` | `TEXT` | Yes | `NULL` | Unique mobile number |
| `password` | `TEXT` | Yes | `NULL` | Bcrypt hashed password |
| `name` | `TEXT` | Yes | `NULL` | Citizen full name |
| `state` | `TEXT` | Yes | `NULL` | Domicile state |
| `language` | `TEXT` | No | `'en'` | Preferred interface language |
| `role` | `TEXT` | No | `'USER'` | 'USER', 'ADMIN', 'PARALEGAL' |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Record modification timestamp |

**Constraints & Indexes**:
- `users_pkey` (PRIMARY KEY, btree `id`)
- `users_email_key` (UNIQUE, btree `email`)
- `users_phone_key` (UNIQUE, btree `phone`)
- `users_email_idx` (btree `email`)
- `users_phone_idx` (btree `phone`)

---

### 5.2 `conversations`
Persistent chat session containers.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `session_id` | `TEXT` | No | — | Client-generated session UUID |
| `user_id` | `UUID` | Yes | `NULL` | Foreign Key -> `users(id)` ON DELETE SET NULL |
| `language` | `TEXT` | No | `'en'` | Active session language |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Session start timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Last message timestamp |

**Constraints & Indexes**:
- `conversations_pkey` (PRIMARY KEY, btree `id`)
- `conversations_session_id_key` (UNIQUE, btree `session_id`)
- `conversations_session_id_idx` (btree `session_id`)
- `conversations_user_id_idx` (btree `user_id`)
- `conversations_created_at_idx` (btree `created_at`)

---

### 5.3 `messages`
Individual conversational dialogue turns.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `conversation_id`| `UUID` | No | — | Foreign Key -> `conversations(id)` ON DELETE CASCADE |
| `role` | `TEXT` | No | — | 'user', 'assistant', 'system' |
| `content` | `TEXT` | No | — | Message dialogue body |
| `language` | `TEXT` | Yes | `NULL` | Language code of message |
| `metadata` | `JSONB` | Yes | `NULL` | Statutory citations and diagnostics |
| `created_at` | `TIMESTAMPTZ`| No | `NOW()` | Message timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `NOW()` | Modification timestamp |

**Constraints & Indexes**:
- `messages_pkey` (PRIMARY KEY, btree `id`)
- `messages_conversation_id_idx` (btree `conversation_id`)
- `messages_created_at_idx` (btree `created_at`)
