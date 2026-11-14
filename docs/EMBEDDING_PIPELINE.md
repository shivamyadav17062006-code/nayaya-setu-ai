# NyayaSaathi — Embedding Pipeline & Vector Indexing Specification

## 1. Dimensionality & Model Consistency

In pgvector systems, dimensionality mismatch between indexing and query generation causes runtime PostgreSQL exceptions. NyayaSaathi enforces strict consistency across all tiers:

| Component | Specification | Description |
| :--- | :--- | :--- |
| **Model Architecture** | 384-dimensional Normalized Projection | Consistent deterministic embedding across Node.js |
| **Vector Dimension** | `384` | Exact dimension of PostgreSQL `vector(384)` column |
| **Distance Metric** | Cosine Distance (`<=>`) | $1 - (A \cdot B) / (\|A\| \|B\|)$ |
| **PostgreSQL Index** | HNSW (`vector_cosine_ops`) | `m = 16`, `ef_construction = 64` for high recall |
| **Storage Table** | `public.legal_chunks` | Managed by Supabase migrations and Prisma |

---

## 2. Ingestion & Embedding Workflow

```text
Statutory Section Record (Act, Section, Title, Text, Simplified)
                            │
                            ▼
      Composite Chunk Assembly (Text + Header + Simplified)
                            │
                            ▼
       embeddingService.embedText() (384-dim normalized vector)
                            │
                            ▼
      INSERT INTO legal_chunks (..., embedding = $1::vector)
                            │
                            ▼
      HNSW Index Update in PostgreSQL
```

### Chunk Formatting Rule:
Every statutory chunk combines the official act title, section number, section title, simplified summary, and original statutory text:
```text
Payment of Wages Act, 1936, Section 15, Claims arising out of deductions from wages or delay in payment

If your wages are delayed or unlawfully deducted, you or your union can file an official compensation claim with the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.

Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person...
```

---

## 3. Vector Search Execution via RPC

Similarity search executes inside PostgreSQL using the hardened function `match_legal_chunks`:

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
LANGUAGE SQL STABLE AS $$
    SELECT
        lc.id,
        lc.section_id,
        lc.content,
        lc.chunk_number,
        lc.language,
        lc.source_url,
        1 - (lc.embedding <=> query_embedding) AS similarity,
        ls.section_number,
        ls.section_title,
        ls.simplified_text,
        ls.original_text,
        la.title AS act_title,
        la.year AS act_year,
        la.source_url AS act_source_url,
        (
            SELECT string_agg(rc.name, ', ' ORDER BY rc.name)
            FROM section_categories sc
            JOIN right_categories rc ON rc.id = sc.category_id
            WHERE sc.section_id = ls.id
        ) AS categories
    FROM legal_chunks lc
    JOIN legal_sections ls ON ls.id = lc.section_id
    JOIN legal_acts la ON la.id = ls.act_id
    WHERE lc.embedding IS NOT NULL
      AND (la.verification_status = 'VERIFIED' OR la.verification_status IS NULL)
      AND (la.status = 'ACTIVE' OR la.status IS NULL)
      AND 1 - (lc.embedding <=> query_embedding) >= min_similarity
    ORDER BY lc.embedding <=> query_embedding
    LIMIT match_count;
$$;
```

---

## 4. Safe Re-Embedding Migration Protocol

If the embedding dimension or model changes in the future (e.g. migrating to a 768-dimensional model):
1. **Never Drop Live Columns**: Add a new column `embedding_v2 vector(NEW_DIM)` to `legal_chunks`.
2. **Dual-write**: Update ingestion scripts to write to both columns.
3. **Backfill**: Execute batched backfills over existing sections.
4. **Deploy RPC v2**: Create `match_legal_chunks_v2` pointing to `embedding_v2`.
5. **Switch Traffic**: Update `embeddingService.js` and `legalService.js`.
6. **Retire v1**: Drop old column and indexes safely.
