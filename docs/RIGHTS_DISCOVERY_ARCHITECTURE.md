# NyayaSaathi — Personalized Know Your Rights Discovery Architecture

## 1. Architectural Philosophy & Core Axioms

The Personalized Know Your Rights Discovery Engine transforms unstructured, plain-language citizen grievance descriptions into verified, actionable legal rights dossiers.

In strict accordance with `AGENTS.md`:
1. **Know Your Rights (KYR), Not Identity KYC**: The platform operates without mandatory user login, Aadhaar authentication, or sensitive personal data harvesting.
2. **Zero Legal Hallucinations**: Rights, section numbers, acts, and procedural deadlines are grounded strictly in sovereign Indian statutes stored in PostgreSQL (`public.legal_acts`, `public.legal_sections`).
3. **Multi-Stage Hybrid Discovery Pipeline**:
   - Semantic vector search in PostgreSQL via `pgvector` ($384$-dimensional dense vector cosine similarity).
   - Relational statutory constraint resolution across Central and State jurisdictions.
   - Deterministic affirmative beneficiary entitlement resolution (such as 100% Free Court Representation under Section 12 of the Legal Services Authorities Act, 1987).
   - Dynamic follow-up question synthesis to resolve legal ambiguities without cognitive overload.

```
       ┌────────────────────────────────────────────────────────┐
       │                 Citizen Situation Intake               │
       │   "Employer withheld 3 months salary and threatened"   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │              Domain Classification Engine              │
       │  - Keyword, regex & intent classification              │
       │  - Domains: LABOUR_WAGES, PWDVA, CONSUMER, TENANCY...   │
       │  - Candidate Beneficiary Identification                │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │            Dynamic Follow-Up Questionnaire             │
       │  - 2-3 minimal legal condition queries                 │
       │  - Explains WHY each fact matters legally              │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │       Hybrid Retrieval & Statutory Grounding           │
       │  - 384-d pgvector semantic search (match_legal_chunks) │
       │  - Relational lookup in public.legal_sections          │
       │  - Beneficiary mapping in public.beneficiaries         │
       │  - Remedies lookup in public.legal_remedies            │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │         Synthesized Personalized Rights Dossier        │
       │  - Applicable Rights with plain-language reasons       │
       │  - Verbatim Statutory Gazette text & India Code URLs   │
       │  - Actionable Remedies (Authority, Limitation, Steps)  │
       │  - Free Legal Aid & 24x7 Helplines (NALSA 15100)       │
       │  - Confidence Level & Missing Information Notes        │
       │  - Statutory Awareness Disclaimer                      │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical Vector Model & Similarity Search

Each published section is embedded into a 384-dimensional dense normalized vector $\vec{v} \in \mathbb{R}^{384}$ using `text-embedding-004` (or deterministic L2-normalized projection fallback).

Given a citizen situation query $\vec{q} \in \mathbb{R}^{384}$, cosine distance is computed in PostgreSQL:

$$\mathcal{D}_{\text{cosine}}(\vec{q}, \vec{v}) = 1 - \frac{\vec{q} \cdot \vec{v}}{\|\vec{q}\|_2 \|\vec{v}\|_2}$$

The query selects only chunks where the parent Act and Section have `verification_status IN ('PUBLISHED', 'VERIFIED')`:

```sql
SELECT c.id, c.section_id, c.content,
       (1 - (c.embedding <=> $1::vector)) as similarity,
       s.section_number, s.section_title, s.simplified_text, s.original_text,
       a.id as act_id, a.title as act_title, a.year as act_year, a.jurisdiction, a.state
FROM public.legal_chunks c
JOIN public.legal_sections s ON c.section_id = s.id
JOIN public.legal_acts a ON s.act_id = a.id
WHERE a.verification_status IN ('PUBLISHED', 'VERIFIED')
  AND s.verification_status IN ('PUBLISHED', 'VERIFIED')
ORDER BY c.embedding <=> $1::vector ASC
LIMIT 6;
```

---

## 3. Privacy Preservation & Session Token Model

1. **Anonymous Session Bookmarks**: When a user consents to saving their query, a random UUIDv4 session token is generated (`session_token`).
2. **Ephemeral Persistence (`public.saved_rights_discoveries`)**:
   - `session_token` (TEXT UNIQUE)
   - `situation_summary` (truncated snippet)
   - `context_data` (JSONB)
   - `discovery_results` (JSONB)
   - `created_at` (TIMESTAMPTZ)
   - `expires_at` (TIMESTAMPTZ, auto-expires in 30 days)
3. **Right to Erasure**: Citizens can trigger `DELETE /api/rights-discovery/session/:token` at any time to immediately and permanently wipe their stored data.
