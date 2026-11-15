# NyayaSaathi (न्यायसाथी) — Version-Aware RAG Intelligence
**Version**: 1.0.0  
**Pipeline**: 10-Step Hybrid Lexical & pgvector Legal Retrieval  
**Date**: November 15, 2026  

---

## 1. The Challenge of Version-Aware Retrieval in Indian Law

A generic vector search retriever frequently fails on legal queries because:
1. Words like *"murder"*, *"theft"*, *"arrest"*, or *"cruelty"* match both the old IPC/CrPC text and the new BNS/BNSS text with virtually identical cosine similarity.
2. An older Act (e.g. Payment of Wages Act 1936) may still be the active procedural statute in Labour Courts even though a newer Act (Code on Wages 2019) has been enacted.
3. Without temporal filtering, a query asking *"What was the law in 2022?"* would hallucinate newly enacted 2024 provisions.

---

## 2. The 10-Step Version-Aware RAG Pipeline

```
[1. Language Detection] ──► Indic script & Hinglish routing
          │
[2. Intent & Goal]      ──► Detects subject (LABOUR, WOMEN, CRIMINAL, CONSUMER)
          │
[3. Query Normalization]──► Expands colloquial terms to statutory keywords
          │
[4. Temporal Detection] ──► Extracts event year (e.g. 2022 vs 2026 vs present)
          │
[5. Vector Search]      ──► pgvector 384-d semantic candidate retrieval
          │
[6. Temporal Filtering] ──► Filters chunks where:
          │                  (effective_from <= T_event) AND (effective_to IS NULL OR effective_to > T_event)
          │
[7. Lifecycle Checks]   ──► Distinguishes IN_FORCE, PARTIALLY_IN_FORCE, NOT_YET_COMMENCED
          │
[8. Precedent Retrieval]──► Retrieves binding Supreme Court case law
          │
[9. Gemini Generation]  ──► Scenario-based zero-hallucination prompt
          │
[10. Citation Validation]──► Cross-checks generated citations against trusted government domains
```

---

## 3. Retrieval Prioritization Matrix

1. **Exact Act & Section Match**: When a citizen mentions a specific section (e.g. "Section 85 BNS" or "Article 21"), the system performs an exact deterministic lookup.
2. **Operative Law Preference**: For wage disputes, prioritizes *Payment of Wages Act 1936* Section 5 & 15 as active operative law, while supplying *Code on Wages 2019* Section 16 as the modern enacted standard.
3. **Savings Clause Preservation**: For criminal inquiries, returns dual citations (*BNS Section 85 / IPC 498A*) so citizens whose disputes originated prior to July 1, 2024 are not prejudiced.
4. **Trusted Domain Validation**: Official links must resolve to `indiacode.nic.in`, `egazette.gov.in`, `mha.gov.in`, `labour.gov.in`, `wcd.nic.in`, or `nalsa.gov.in`.
