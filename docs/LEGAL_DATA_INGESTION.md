# NyayaSaathi (न्यायसाथी) — Legal Data Ingestion Engine
**Version**: 1.0.0  
**Stack**: JavaScript ES Modules, Prisma Client, pgvector, Supabase  
**Date**: November 15, 2026  

---

## 1. Architectural Overview

The NyayaSaathi Legal Data Ingestion Engine is implemented in 100% native JavaScript ES Modules (`node:fs`, `node:crypto`, `@prisma/client`, and `ai-engine/src/services/embeddingService.js`). It transforms raw statutory records, gazette notifications, and plain-language summaries into structured PostgreSQL knowledge graphs and dense 384-dimensional vector embeddings.

```
       [ Official Gazette / India Code ]
                       │
                       ▼
          [ Document Checksum (SHA-256) ]
                       │
                       ▼
      [ Ingestion Pipeline: scripts/modernizeLegalKnowledge.js ]
         ├── 1. Upsert LegalAct (Temporal Validity, 14-State Lifecycle)
         ├── 2. Upsert LegalSection (Operative status, Simplified text)
         ├── 3. Link SectionRight & SectionBeneficiary Relational Nodes
         └── 4. Generate 384-d L2 Normalized Vector Embeddings
                       │
                       ▼
        [ Supabase PostgreSQL + pgvector ]
         ├── public.legal_acts (36 rows)
         ├── public.legal_sections (118 rows)
         └── public.legal_chunks (153 rows)
```

---

## 2. Ingestion Rules & Data Validation

1. **Non-Destructive Upsert**:
   - Ingestion scripts NEVER use `DROP TABLE` or `prisma migrate reset`.
   - Every instrument uses composite unique constraints (`[actId, sectionNumber]` for sections; `[sectionId, chunkNumber, language]` for chunks).
2. **Mandatory Checksum Calculation**:
   - Each ingested act stores a SHA-256 checksum to prevent silent drift or corrupted text ingestion.
3. **Temporal Validity Enforcement**:
   - Every ingested Act must specify `status` from the 14-state lifecycle model.
   - For newly commenced criminal codes (BNS 2023, BNSS 2023), `commencementDate` is set to `2024-07-01` with explicit `savingsClauseRef`.
   - For the Four Labour Codes, `isPartiallyCommenced` and `commencedSections` / `stagedSections` are recorded explicitly.
4. **Zero Legal Hallucination**:
   - Acts that are not verified against official gazette entries are marked `UNVERIFIED` and excluded from operational citizen advice.
