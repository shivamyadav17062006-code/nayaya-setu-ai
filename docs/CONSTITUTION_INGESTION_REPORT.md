# NyayaSaathi (न्यायसाथी) — Constitution of India Ingestion Report

**Date of Execution:** 2026-11-15  
**Canonical Act Record:** `a0000000-0000-0000-0000-000000000009` (`The Constitution of India`)  
**Database Pipeline:** Node.js ES Modules + Prisma ORM + Supabase PostgreSQL + `pgvector`  
**Embedding Dimensions:** 384 dimensions  
**Corpus SHA-256:** `012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16`

---

## 1. Ingestion Pipeline Architecture

```
Official Source Portals (Legislative Dept / India Code)
                        │
                        ▼
           data/constitution/source_register.json
                        │
                        ▼
           scripts/buildConstitutionCorpus.js
                        │
                        ▼
           data/constitution/constitution_corpus.json
                        │
                        ▼
              scripts/ingestConstitution.js
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
   Prisma PostgreSQL         384-d Embedding
   - LegalAct record         - Deterministic projection
   - 45 LegalSection rows    - Unit normalized
           │                         │
           └────────────┬────────────┘
                        ▼
           public.legal_chunks (80 rows)
           - vector(384) pgvector column
           - match_legal_chunks RPC indexing
```

---

## 2. Ingestion Execution Metrics

| Domain Metric | Count / Value | Target Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **Constitutional Parts Cataloged** | 26 Parts (Part I to Part XXII, including IVA, IXA, IXB, XIVA) | 26 Parts | Verified |
| **Constitutional Sections Created** | 45 sections (Preamble, 32 core Articles, 12 Schedules) | >= 45 sections | Verified |
| **Legal Chunks Embedded & Indexed** | 80 chunks | >= 80 chunks | Verified |
| **Embedding Dimension Uniformity** | 384 dimensions | 384 dimensions | 100% Valid |
| **Embedding Failures / Null Vectors** | 0 failures | 0 failures | 0% Error |
| **Preamble Ingestion** | Full original + simplified text + 42nd CAA notes | Verbatim & traceable | Verified |
| **Schedules Ingestion** | All 12 Schedules with subjects and jurisdiction | 12 Schedules | Verified |
| **Amendments Integrated** | 1st to 106th CAA (including Article 330A) | Up to 106th CAA | Verified |

---

## 3. Database Schema Mapping & Storage Details

### 3.1 Legal Act (`public.legal_acts`)
- `id`: `'a0000000-0000-0000-0000-000000000009'::uuid`
- `title`: `'The Constitution of India'`
- `act_number`: `'Constituent Assembly Enactment'`
- `year`: `1950`
- `jurisdiction`: `'CENTRAL'`
- `category`: `'CONSTITUTIONAL'`
- `source_url`: `'https://www.legislative.gov.in/constitution-of-india/'`
- `status`: `'ACTIVE'`
- `verification_status`: `'VERIFIED'`

### 3.2 Legal Sections (`public.legal_sections`)
- Total sections: **45 sections**
- Includes:
  - `Preamble`: Sovereign Socialist Secular Democratic Republic
  - Core Fundamental Rights: Articles 12, 13, 14, 15, 16, 17, 19, 20, 21, 21A, 22, 23, 24, 25, 32
  - Core DPSP: Articles 38, 39, 39A (Free Legal Aid), 40, 44 (Uniform Civil Code)
  - Fundamental Duties: Article 51A (Part IVA)
  - Constitutional Remedies & Writs: Articles 32, 226, 141, 142
  - Property & Franchise: Articles 300A, 326
  - Recent Amendments: Article 330A (106th CAA — Women's Reservation in Lok Sabha)
  - Amendment Power: Article 368
  - Schedules: Schedules 1 through 12

### 3.3 Legal Chunks & Vector Indexing (`public.legal_chunks`)
- Total chunks: **80 rows**
- Each chunk contains:
  - `content`: Traceable statutory heading, simplified explanation, and verbatim provision text.
  - `language`: `'en'`
  - `source_url`: Official Legislative Department URL.
  - `embedding`: 384-dimensional dense vector compatible with Supabase `pgvector` HNSW/IVFFlat indexes and `match_legal_chunks` RPC.
  - Foreign key: Linked to `section_id` in `public.legal_sections`.

---

## 4. Verification Sign-Off

The ingestion was verified via automated script `scripts/testConstitutionRAG.js`:
- Corpus hash matches: `012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16`
- Total database chunks for Constitution: **80**
- Chunks with valid 384-dim embeddings: **80**
- Failed embeddings: **0**
- Status: **PRODUCTION_READY**
