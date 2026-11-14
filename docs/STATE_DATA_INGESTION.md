# State Legislation Data Ingestion & Database Architecture

## 1. Overview & Data Pipeline

The NyayaSaathi ingestion engine incorporates state enactments, state-specific amendments, and state subordinate rules directly into Supabase PostgreSQL with 384-dimensional dense vector embeddings.

```
       Verified Official Sources (State Gazettes, India Code, SLSAs)
                                    |
                                    v
            scripts/buildStateLegislationCorpus.js
                                    |
                                    v
          data/jurisdiction/state_legislation_corpus.json
            (Cryptographic SHA-256 Checksum Verified)
                                    |
                                    v
            scripts/ingestStateLegislation.js
                                    |
       +----------------------------+----------------------------+
       |                                                         |
       v                                                         v
  PostgreSQL Relational Schema                           pgvector Embeddings
  - public.legal_acts                                     - embeddingService.embedText()
    (jurisdiction = 'STATE', state = 'MH')                - 384-dimensional dense vectors
  - public.legal_sections                                 - public.legal_chunks
    (originalText, simplifiedText)                          (vector(384) with HNSW indexing)
```

---

## 2. Relational Schema Mapping

State legislation is stored directly in the core legal knowledge tables:

### `public.legal_acts`
* `id`: UUID (Primary Key, e.g. `d1000000-0000-0000-0000-000000000001`)
* `title`: Full statutory title (e.g., *Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017*)
* `act_number`: State legislative number (e.g., *Maharashtra Act No. LXI of 2017*)
* `year`: Enactment year (integer)
* `jurisdiction`: `'STATE'`
* `state`: Canonical uppercase state name (e.g., `'MAHARASHTRA'`, `'DELHI'`, `'KARNATAKA'`)
* `document_type`: `'ACT'` | `'RULE'` | `'REGULATION'` | `'NOTIFICATION'`
* `parent_act_id`: UUID pointing to the parent Central Act for subordinate legislation (e.g., MSLSA Rules point to LSAA 1987)
* `ministry`: State Department (e.g., *Department of Labour, Government of Maharashtra*)
* `source_url`: Official traceable India Code or State portal URL
* `verification_status`: `'PUBLISHED'`

### `public.legal_sections`
* `id`: UUID (Primary Key)
* `act_id`: Foreign Key referencing `legal_acts.id`
* `section_number`: Statutory section or rule (e.g., `'Section 6'`, `'Section 13'`, `'Rule 14'`)
* `title`: Section heading (e.g., *Wages for overtime work*)
* `original_text`: Verbatim statutory clause from the official Gazette
* `simplified_text`: Plain-language legal rights explanation for citizens

### `public.legal_chunks`
* `id`: UUID
* `section_id`: Foreign Key referencing `legal_sections.id`
* `content`: Rich statutory chunk text prefixed with `[STATE STATE_NAME LAW]` tag
* `chunk_number`: Integer (e.g., 1)
* `language`: `'en'`
* `embedding`: Dense `vector(384)` indexed with PostgreSQL pgvector

---

## 3. Database Verification Queries

To verify state legislation in PostgreSQL:

```sql
-- 1. Inspect Ingested State Legislation Count by Jurisdiction
SELECT la.jurisdiction, la.state, COUNT(DISTINCT la.id) as acts_count, COUNT(ls.id) as sections_count
FROM legal_acts la
LEFT JOIN legal_sections ls ON ls.act_id = la.id
WHERE la.jurisdiction = 'STATE'
GROUP BY la.jurisdiction, la.state
ORDER BY la.state;

-- 2. Verify pgvector Embedding Dimensions for State Chunks
SELECT la.state, la.title, ls.section_number, vector_dims(lc.embedding) as dims
FROM legal_chunks lc
JOIN legal_sections ls ON ls.id = lc.section_id
JOIN legal_acts la ON la.id = ls.act_id
WHERE la.jurisdiction = 'STATE'
LIMIT 10;

-- 3. Test Upgraded match_legal_chunks RPC Function
SELECT id, act_title, act_jurisdiction, act_state, section_number, similarity
FROM public.match_legal_chunks(
    (SELECT embedding FROM legal_chunks WHERE content LIKE '%Maharashtra Shops%' LIMIT 1),
    5,
    0.0
);
```

---

## 4. Current Knowledge Base Volume

| Layer | Domain | Documents Count | Sections Count | Dense Vector Chunks (`vector(384)`) |
|:---|:---|:---:|:---:|:---:|
| **Constitutional** | Constitution of India (1950) | 1 Consolidated | 45 Articles/Schedules | 80 Chunks |
| **Central Statutory** | Central Acts, Rules & Notifications | 18 Documents | 26 Sections | 26 Chunks |
| **State Statutory** | Maharashtra, Delhi, Karnataka Laws & Rules | 9 Documents | 21 Sections | 21 Chunks |
| **Total** | **Comprehensive Knowledge Base** | **28 Documents** | **92 Sections** | **127 Chunks** |
