# RAG Database Contract & Query Lifecycle — NyayaSaathi (न्यायसाथी)

This document describes how a citizen's plain-language legal question is processed, embedded, and resolved into grounded statutory provisions via the **`match_legal_chunks`** stored procedure.

---

## 1. End-to-End Query Lifecycle

```
[Citizen Question]
  "My employer has withheld my salary for 3 months"
       │
       ▼
1. Language Detection & Normalization (`languageService.js`)
   - Detects script (English / Hindi / Indic)
   - Normalizes whitespace, removes common query noise
       │
       ▼
2. Vector Embedding Generation (`embeddingService.js`)
   - Generates 384-dimensional L2-normalized vector
   - Produces `query_embedding` array of 384 floats
       │
       ▼
3. PostgreSQL pgvector Stored Procedure Call (`legalService.js`)
   - Invokes `supabase.rpc('match_legal_chunks', { query_embedding, match_count: 5, min_similarity: 0.0 })`
       │
       ▼
4. PostgreSQL Cosine Similarity Search (`pgvector`)
   - Evaluates: `1 - (lc.embedding <=> query_embedding) AS similarity`
   - Applies HNSW cosine index (`legal_chunks_embedding_idx`)
   - Filters: `verification_status = 'VERIFIED'` and `status = 'ACTIVE'`
   - Orders by vector distance ascending, limits to `match_count`
       │
       ▼
5. Relational Hydration & Join
   - Joins `legal_sections` on `lc.section_id = ls.id`
   - Joins `legal_acts` on `ls.act_id = la.id`
   - Aggregates category names via `section_categories`
       │
       ▼
6. AI Context Assembly & Prompt Synthesis (`ragService.js`)
   - Inserts verified section numbers, simplified explanations, and India Code URLs into system prompt
   - Passes context to Google Gemini JS SDK (`@google/genai`) or verified statutory fallback
       │
       ▼
[Grounded Citizen Response]
   - Conversational explanation
   - Verbatim statutory citations (§5 & §15 Payment of Wages Act, 1936)
   - Actionable next steps & NALSA Legal Helpline (15100)
```

---

## 2. Stored Procedure Interface (`public.match_legal_chunks`)

### SQL Signature
```sql
CREATE OR REPLACE FUNCTION match_legal_chunks (
    query_embedding vector(384),
    match_count INT DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.0
)
RETURNS TABLE (
    id UUID,
    section_id UUID,
    content TEXT,
    chunk_number INT,
    language TEXT,
    source_url TEXT,
    similarity FLOAT,
    section_number TEXT,
    section_title TEXT,
    simplified_text TEXT,
    original_text TEXT,
    act_title TEXT,
    act_year INT,
    act_source_url TEXT,
    categories TEXT
)
LANGUAGE SQL
STABLE;
```

### Argument Specifications
| Argument | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `query_embedding` | `vector(384)` | *Required* | Normalized 384-dimensional query vector |
| `match_count` | `INT` | `5` | Maximum number of provisions to retrieve |
| `min_similarity` | `FLOAT` | `0.0` | Lower bound cosine similarity threshold |

### Return Column Specifications
| Column | Type | Origin | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `legal_chunks.id` | Unique chunk record identifier |
| `section_id` | `UUID` | `legal_sections.id` | Parent legal section UUID |
| `content` | `TEXT` | `legal_chunks.content` | Exact text passage indexed for retrieval |
| `chunk_number` | `INT` | `legal_chunks.chunk_number` | Sliced chunk sequence number |
| `language` | `TEXT` | `legal_chunks.language` | Language code (e.g. `'en'`) |
| `source_url` | `TEXT` | `legal_chunks.source_url` | Chunk reference link |
| `similarity` | `FLOAT` | Calculated | $1 - (\text{embedding} \Leftrightarrow \text{query\_embedding})$ |
| `section_number`| `TEXT` | `legal_sections.section_number`| Statutory section (e.g. `'Section 5'`) |
| `section_title` | `TEXT` | `legal_sections.section_title` | Marginal heading |
| `simplified_text`| `TEXT` | `legal_sections.simplified_text`| Plain-language citizen summary |
| `original_text` | `TEXT` | `legal_sections.original_text` | Verbatim statutory provision |
| `act_title` | `TEXT` | `legal_acts.title` | Full name of parent Act |
| `act_year` | `INT` | `legal_acts.year` | Year enacted |
| `act_source_url`| `TEXT` | `legal_acts.source_url` | Official India Code URL |
| `categories` | `TEXT` | `right_categories.name` | Comma-delimited category tags |

---

## 3. Client Consumption in JavaScript

### Node.js AI Engine Invocation (`ai-engine/src/services/legalService.js`)
```javascript
const { data, error } = await supabase.rpc('match_legal_chunks', {
  query_embedding: queryEmbedding,
  match_count: limit,
  min_similarity: config.ragSimilarityThreshold, // 0.0
});

if (!error && Array.isArray(data)) {
  return data.map((item) => ({
    act: item.act_title,
    year: item.act_year,
    section: item.section_number,
    title: item.section_title || item.section_number,
    text: item.content,
    simplified: item.simplified_text || item.content,
    source_url: item.act_source_url || item.source_url,
    similarity: item.similarity,
  }));
}
```
