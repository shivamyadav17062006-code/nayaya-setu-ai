# NyayaSaathi — Legal Data Architecture (KMS)

## 1. Architectural Overview

The NyayaSaathi Legal Knowledge Management System (KMS) serves as the canonical, authoritative repository of Indian statutory law, subordinate legislation, constitutional provisions, administrative guidelines, and judicial precedents.

The architecture strictly adheres to three fundamental axioms:
1. **Single Source of Truth**: PostgreSQL in Supabase acts as the primary relational and vector datastore.
2. **Separation of Statutory Authority from AI Derivations**: Original statutory text (`original_text`), official citations, gazette notifications, and sovereign URLs are permanently isolated from plain-language citizen explanations (`simplified_text`) and AI-generated syntheses.
3. **Guaranteed Vector Isolation via Verification Gates**: Only records verified by legal administrators and transitioned to `PUBLISHED` status are embedded as 384-dimensional dense vectors in `public.legal_chunks`. `DRAFT`, `UNDER_REVIEW`, `REJECTED`, and `SUPERSEDED` records are strictly de-indexed from citizen search.

```
       ┌────────────────────────────────────────────────────────┐
       │             Official Government Repositories           │
       │    (India Code, e-Gazette, Ministries, SLSAs, SCI)     │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │        Ingestion Engine (Node.js ES Modules)           │
       │   - Schema Validation & Canonical URL Resolution       │
       │   - Duplicate Detection & SHA-256 Checksums            │
       │   - Structured Gazette Text / HTML Regex Parser        │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
                      Status: DRAFT / UNDER_REVIEW
       ┌────────────────────────────────────────────────────────┐
       │              PostgreSQL Relational Schema              │
       │   - public.legal_acts                                  │
       │   - public.legal_sections                              │
       │   - public.legal_revisions                             │
       │   - public.legal_audit_logs                            │
       └───────────────────────────┬────────────────────────────┘
                                   │
                       Human Review & Verification
                                   │
                                   ▼
                           Status: PUBLISHED
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │          Dense 384-d Vector Synchronization            │
       │   - public.legal_chunks (pgvector)                     │
       │   - Hierarchical Contextual Prefixes                   │
       │   - Cosine Similarity & match_legal_chunks RPC         │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Relational Schema & Entity-Relationship Model

### 2.1 Core Statutory Entities

#### `public.legal_acts`
Represents primary Acts, Codes, Rules, Regulations, Orders, and Ordinances.
- `id` (UUID, Primary Key): Canonical identifier.
- `title` (TEXT, NOT NULL): Official short title as gazetted.
- `act_number` (TEXT): Official enactment number (e.g., `Act No. 35 of 2019`).
- `year` (INT, NOT NULL): Calendar year of enactment.
- `jurisdiction` (TEXT, NOT NULL): Enum check (`CENTRAL`, `STATE`).
- `state` (TEXT): State identifier if jurisdiction is `STATE` (e.g., `MAHARASHTRA`, `DELHI`).
- `category` (TEXT): Right / statutory category (`LABOUR_WAGES`, `WOMEN_RIGHTS`, `CONSUMER_PROTECTION`, `LEGAL_AID`, `CONSTITUTIONAL`).
- `document_type` (TEXT): `ACT`, `RULES`, `REGULATIONS`, `NOTIFICATION`, `ORDER`.
- `parent_act_id` (UUID, Nullable): Foreign key referencing `public.legal_acts(id)` for subordinate rules.
- `source_url` (TEXT, NOT NULL): Direct permalink to India Code or State Gazette.
- `checksum` (TEXT): SHA-256 hash of official source document.
- `verification_status` (TEXT, DEFAULT `'DRAFT'`): Lifecycle state machine status (`DRAFT`, `UNDER_REVIEW`, `VERIFIED`, `PUBLISHED`, `SUPERSEDED`, `REJECTED`).
- `reviewer_id` (TEXT): Identity of legal auditor.
- `review_notes` (TEXT): Notes accompanying verification or rejection.
- `last_reviewed_at` (TIMESTAMPTZ): Timestamp of last workflow transition.

#### `public.legal_sections`
Granular legal provisions, Articles, Clauses, and Rules.
- `id` (UUID, Primary Key): Unique provision identifier.
- `act_id` (UUID, Foreign Key): References `public.legal_acts(id)` with `ON DELETE CASCADE`.
- `section_number` (TEXT, NOT NULL): Official provision label (e.g., `Section 12`, `Article 21`, `Rule 14`).
- `section_title` (TEXT): Title or marginal note of the section.
- `original_text` (TEXT, NOT NULL): Unaltered verbatim statutory text from the official Gazette.
- `simplified_text` (TEXT): Plain-language citizen explanation verified by legal editors.
- `verification_status` (TEXT, DEFAULT `'PUBLISHED'`): Section-level verification status.
- `reviewer_id` (TEXT): Section auditor identity.
- `review_notes` (TEXT): Section review rationale.

---

### 2.2 Governance, Audit, and Revision Entities

#### `public.legal_revisions`
Immutable chronological snapshots captured before any update or status transition.
- `id` (UUID, Primary Key).
- `entity_type` (TEXT, NOT NULL): `'ACT'` or `'SECTION'`.
- `entity_id` (UUID, NOT NULL): Target entity ID.
- `revision_number` (INT, NOT NULL DEFAULT 1).
- `title` (TEXT): Entity title at time of revision.
- `content_snapshot` (JSONB, NOT NULL): Complete serialized JSON state.
- `created_by` (TEXT): Email or user ID of author.
- `created_at` (TIMESTAMPTZ, DEFAULT `NOW()`).

#### `public.legal_audit_logs`
Cryptographically traceable ledger of every user action and automated event.
- `id` (UUID, Primary Key).
- `entity_type` (TEXT, NOT NULL): Target entity type.
- `entity_id` (UUID, NOT NULL): Target entity ID.
- `action` (TEXT, NOT NULL): `CREATE`, `UPDATE`, `SUBMIT_REVIEW`, `VERIFY`, `PUBLISH`, `REJECT`, `SUPERSEDE`.
- `actor_email` (TEXT): Author or reviewer email.
- `actor_role` (TEXT, DEFAULT `'ADMIN'`).
- `previous_state` (JSONB): Pre-transition entity status.
- `new_state` (JSONB): Post-transition entity status.
- `review_notes` (TEXT): Justification or rejection feedback.
- `created_at` (TIMESTAMPTZ, DEFAULT `NOW()`).

#### `public.legal_import_batches`
Tracks bulk automated ingestion jobs from official external repositories.
- `id` (UUID, Primary Key).
- `source_name` (TEXT, NOT NULL): Name of government repository.
- `source_url` (TEXT): URL where batch originated.
- `import_type` (TEXT): `JSON_IMPORT`, `HTML_EXTRACT`, `GAZETTE_PDF`.
- `status` (TEXT): `PENDING`, `PROCESSED`, `PARTIAL`, `FAILED`.
- `total_records` (INT).
- `imported_records` (INT).
- `rejected_records` (INT).
- `error_log` (JSONB).
- `imported_by` (TEXT).
- `created_at` (TIMESTAMPTZ).

---

### 2.3 Vector Embeddings & RAG Integration (`public.legal_chunks`)

- `id` (UUID, Primary Key).
- `section_id` (UUID, Foreign Key): References `public.legal_sections(id)` with `ON DELETE CASCADE`.
- `chunk_number` (INT, DEFAULT 1).
- `language` (VARCHAR(10), DEFAULT `'en'`).
- `content` (TEXT, NOT NULL): Hierarchically prefixed content string:
  `"[STATE LAW] Act Title, Section Number, Section Title, Simplified Explanation \n\n Original Text"`
- `embedding` (`vector(384)`): 384-dimensional dense semantic embedding.
- `source_url` (TEXT): Official statutory source permalink.

---

## 3. Vector Isolation Security Model

To prevent legal misinformation, hallucinations, or citational confusion:
1. **Zero Unverified Chunks**: Rows in `public.legal_chunks` are created **only** when `act.verification_status IN ('PUBLISHED', 'VERIFIED')` and `section.verification_status IN ('PUBLISHED', 'VERIFIED')`.
2. **Instant De-indexing on Modification / Rejection**: Reverting an Act to `DRAFT` or marking it `REJECTED` executes an immediate database trigger purging all associated entries in `public.legal_chunks`.
3. **Superseded Law Eviction**: Marking an Act `SUPERSEDED` immediately purges its chunks from citizen retrieval, preventing outdated legal provisions from being presented as active rights.
