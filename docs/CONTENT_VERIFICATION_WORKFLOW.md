# NyayaSaathi — Content Verification Workflow & Governance

## 1. The 5-Stage Verification State Machine

To uphold the Know Your Rights (KYR) mandate and eliminate legal misinformation, NyayaSaathi implements a rigorous, role-governed verification state machine across all statutory and regulatory assets.

```
       ┌───────────┐      SUBMIT_REVIEW       ┌────────────────┐
       │   DRAFT   │ ───────────────────────► │  UNDER_REVIEW  │
       └─────▲─────┘                          └───────┬────────┘
             │                                        │
             │ REJECT                                 │ APPROVE_VERIFY
             │ (with mandatory notes)                 │
             │                                        ▼
             │                                ┌────────────────┐
             └────────────────────────────────┤    VERIFIED    │
                                              └───────┬────────┘
                                                      │
                                                      │ PUBLISH
                                                      │ (Triggers RAG vector sync)
                                                      ▼
                                              ┌────────────────┐
                                              │   PUBLISHED    │
                                              └───────┬────────┘
                                                      │
                                                      │ SUPERSEDE
                                                      │ (Purges vector chunks)
                                                      ▼
                                              ┌────────────────┐
                                              │   SUPERSEDED   │
                                              └────────────────┘
```

---

## 2. Stage Definitions & Role Permissions

| Status | Citizen RAG Visibility | Permitted Actor Roles | Description & Requirements |
|:---|:---:|:---|:---|
| `DRAFT` | **HIDDEN (0 chunks)** | Any Contributor, Scraper, Paralegal | Newly ingested or extracted legal content. Subject to automated schema validation and duplicate detection. |
| `UNDER_REVIEW` | **HIDDEN (0 chunks)** | Paralegal, Legal Editor, Admin | Placed in the administrative review queue. Awaiting statutory comparison and citation verification. |
| `VERIFIED` | **HIDDEN (0 chunks)** | Senior Legal Counsel, Verifier | Statutory citations cross-checked against India Code consolidated database. Enactment and repeal status confirmed. |
| `PUBLISHED` | **INDEXED (384-d pgvector)** | Lead Editor, Senior Admin | Authorized for public release. Automatically triggers dense 384-dimensional vector embedding generation and storage in `public.legal_chunks`. |
| `SUPERSEDED` | **PURGED (0 chunks)** | Lead Editor, Admin | Legal enactment replaced or repealed by newer statutory enactment (e.g., IPC superseded by BNS). Chunks are evicted from citizen search. |
| `REJECTED` | **PURGED (0 chunks)** | Verifier, Admin | Reverted to `DRAFT` with mandatory reviewer feedback notes detailing required factual corrections. |

---

## 3. Immutable Revisions & Content Diffing

Before any mutation occurs on `public.legal_acts` or `public.legal_sections`, the KMS automatically creates an immutable revision snapshot in `public.legal_revisions`:
- **Snapshot Capture**: Serializes the complete JSON representation of the entity prior to update.
- **Revision Numbering**: Increments monotonically (`rev_1`, `rev_2`, etc.) per entity.
- **Side-by-Side Comparison**: Enables administrators to visualize before-and-after text changes (e.g., amendments to fines, procedural timelines, or simplified explanations).

---

## 4. Automatic Vector Synchronization Engine (`kmsRAGSyncService`)

The RAG vector sync service acts as a strict firewall between database changes and public citizen discovery:
1. **On `PUBLISH`**:
   - Compiles hierarchical text: `"[STATE LAW] Act Title, Section Number, Section Title, Simplified Explanation \n\n Original Text"`.
   - Generates 384-dimensional semantic dense embedding via Google Gen AI.
   - Upserts chunk in `public.legal_chunks` with `chunk_number = 1`, `language = 'en'`, and source URL.
2. **On `REJECT` or `SUPERSEDE`**:
   - Executes parameterized database deletion:
     ```sql
     DELETE FROM public.legal_chunks 
     WHERE section_id IN (
       SELECT id FROM public.legal_sections WHERE act_id = $1::uuid
     );
     ```
   - Citizens querying the legal assistant will immediately cease receiving repealed or superseded provisions.
