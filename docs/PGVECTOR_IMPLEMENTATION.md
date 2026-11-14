# pgvector Implementation & Vector Indexing — NyayaSaathi (न्यायसाथी)

This document details the vector database architecture, dimensionality calibration, HNSW indexing, and similarity search mechanics implemented in **Supabase PostgreSQL** for NyayaSaathi.

---

## 1. Vector Database Foundation

NyayaSaathi uses the **`pgvector`** extension in PostgreSQL for native vector persistence and semantic search:

- **Extension Name**: `vector`
- **Installed Version**: `0.8.2`
- **Vector Column**: `legal_chunks.embedding`
- **Data Type**: `vector(384)`
- **Similarity Metric**: Cosine Distance (`vector_cosine_ops`, operator `<=>`)
- **Index Type**: Hierarchical Navigable Small World (**HNSW**)

---

## 2. Embedding Model Calibration (384 Dimensions)

### The 384-Dimension Standard
NyayaSaathi standardizes on **384-dimensional normalized vectors** across all AI services:
1. **Model Reference**: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions).
2. **JavaScript Embedding Service**: [`ai-engine/src/services/embeddingService.js`](file:///Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai/ai-engine/src/services/embeddingService.js).
3. **Core Rule**: **The exact same embedding model must be used for both indexing and querying.**

### Why Cross-Model Embeddings Fail
When documents are stored using one model (e.g. PyTorch MiniLM) and queried using another (e.g. hash projection or a different transformer), the resulting vector spaces are not aligned. Cosine similarity between related concepts drops to near-zero or negative values (-0.05). 

In Phase 7, all chunks in `legal_chunks` were re-embedded using the canonical JavaScript `embeddingService`. Cosine similarity for relevant statutory provisions immediately surged from `-0.05` to **`+0.494`** (Payment of Wages Act, Section 5).

---

## 3. HNSW vs. IVFFlat Indexing Strategy

We evaluated both indexing algorithms supported by `pgvector`:

| Criterion | HNSW (Implemented) | IVFFlat |
| :--- | :--- | :--- |
| **Search Speed** | Sub-millisecond (ultra-fast) | Fast, but degrades on small lists |
| **Recall Accuracy** | High (>95% recall) | Moderate (70–85%) |
| **Build Time** | Higher build time | Lower build time |
| **Memory Footprint**| Slightly higher | Lower |
| **Maintenance** | **Zero training needed; incremental inserts remain fully indexed** | **Requires clustering training; must re-index as data grows** |
| **Operational Fit** | **Optimal for legal statutory corpus (100–100,000 sections)** | Suboptimal for dynamically seeded legal codes |

### Index Definition (`legal_chunks_embedding_idx`)
```sql
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING hnsw (embedding vector_cosine_ops);
```

---

## 4. Vector Operations in SQL

- **Cosine Distance Operator**: `<=>`
  ```sql
  SELECT 1 - (embedding <=> query_embedding) AS similarity
  FROM legal_chunks;
  ```
- **Similarity Formula**:
  $$\text{Similarity} = 1 - \text{Cosine Distance}$$
  A similarity of `1.0` represents an identical vector; `0.0` represents orthogonality; negative values represent opposing vectors.
