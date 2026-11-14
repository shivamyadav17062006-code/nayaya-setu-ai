# NyayaSaathi (न्यायसाथी) — Complete RAG System Architecture

## 1. Overview & System Mission

The NyayaSaathi Retrieval-Augmented Generation (RAG) system translates complex Indian statutory jurisprudence into plain, accessible, and compassionate legal awareness for citizens. In strict compliance with `AGENTS.md`:
- **Implementation Language**: 100% JavaScript (Node.js ES Modules).
- **Zero Legal Hallucinations**: Every cited legal provision is strictly retrieved from verified statutory records (Constitution of India, Payment of Wages Act, PWDVA, POSH Act, Consumer Protection Act, Legal Services Authorities Act, Transfer of Property Act).
- **Single Source of Truth**: Supabase PostgreSQL with `pgvector` (`384` dimensions) and the `public.match_legal_chunks` RPC.
- **Statutory Awareness Disclaimer**: Every answer directs citizens to NALSA Helpline **15100** or local District Legal Services Authorities (DLSA) for formal legal representation.

---

## 2. Request-to-Answer Data Flow

```text
                  Citizen Question (Indic / English / Hinglish)
                                      │
                                      ▼
                      1. Language Detection & Unicode NFC
                         (languageService.js & indicScripts.js)
                                      │
                                      ▼
                      2. Legal Intent & Goal Classification
                         (intentService.js — 9 Domains, 5 Goal Types)
                                      │
                                      ▼
                      3. Question Normalization & Expansion
                         (queryNormalizer.js — Acronyms: POSH, DLSA, etc.)
                                      │
                                      ▼
                      4. Query Embedding Generation
                         (embeddingService.js — 384 dimensions)
                                      │
                                      ▼
                      5. Supabase Vector Search (pgvector)
                         (match_legal_chunks RPC via HNSW Cosine Index)
                                      │
                                      ▼
                      6. Legal Document Retrieval
                         (Joined legal_acts, legal_sections, categories)
                                      │
                                      ▼
                      7. Relevance Ranking & Deduplication
                         (Composite Hybrid Score: Vector + Lexical + Intent)
                                      │
                                      ▼
                      8. Verified Legal Context Formation
                         (Isolated Untrusted Block: <retrieved_legal_context>)
                                      │
                                      ▼
                      9. Gemini Generation
                         (Dedicated Prompt Templates: Rights / Aid / Procedure)
                                      │
                                      ▼
                     10. Citation Validation & Sanitization
                         (citationValidator.js — Grounding & URL Check)
                                      │
                                      ▼
                      Final Structured Legal Awareness Response
```

---

## 3. Dedicated Prompt Templates

The AI Engine selects from 5 specialized scenario prompt templates in `ai-engine/src/utils/prompts.js` based on detected citizen goal:

1. **`GENERAL_LEGAL_EXPLANATION`**: Comprehensive overview distinguishing verified legal facts from simplified citizen explanations.
2. **`RIGHTS_DISCOVERY`**: Focuses on citizen entitlements, statutory shields, and state obligations under the Constitution and special acts.
3. **`LEGAL_AID_GUIDANCE`**: Details Section 12 criteria under the Legal Services Authorities Act, 1987 (100% free advocate for women, children, workers, SC/ST, and low-income groups).
4. **`COMPLAINT_PROCEDURE`**: Sequential chronological roadmap (Evidence Gathering $\rightarrow$ 15-day notice $\rightarrow$ Statutory Portal e.g. e-Daakhil / ICC $\rightarrow$ Court/DLSA escalation).
5. **`DOCUMENT_EXPLANATION`**: Demystifies formal contracts, lease agreements, or legal notices without jargon.

---

## 4. Prompt Injection Defense & Untrusted Data Isolation

Retrieved legal records are treated strictly as **untrusted data**:
- Enclosed in explicit XML tags: `<retrieved_legal_context>...</retrieved_legal_context>`.
- System prompts strictly forbid execution of any prompt instructions embedded within the retrieved text.
- Responses undergo secondary post-processing to replace any ungrounded section numbers before delivery.

---

## 5. UI/UX Refinements

The frontend React chat interface (`frontend/src/pages/Chat.jsx`) features:
- **Applicable Law Cards**: Displays Act name, section (§), jurisdiction pill (`CENTRAL`/`STATE`), and `VERIFIED` status badge.
- **Collapsible Statute Inspector**: Allows citizens to toggle and read the verbatim statutory legal text alongside the AI's simplified explanation.
- **Action Roadmap**: Interactive checklist of concrete next steps.
- **Clickable Government Links**: Direct links to official repositories on India Code, Legislative Department, and NALSA.
- **No-Results & Failure Recovery**: Informative notice with one-click retry and direct NALSA 15100 referral when queries do not match local records.
