# Indian Judicial Precedent & Case Law Architecture

## 1. Executive Summary

NyayaSaathi's Know Your Rights (KYR) platform incorporates judicial precedents alongside the statutory knowledge base. In India's common law jurisprudence, statutory text is brought to life and bounded by judicial interpretation.

However, mixing court interpretations with original statutory text risks confusing citizens. This architecture establishes:
1. A **dedicated, first-class relational schema** for case law.
2. A **separate retrieval channel** for judicial precedents within the RAG pipeline.
3. Strict **authority classification** based on court hierarchy and **Article 141** of the Constitution.
4. Transparent labeling of summaries as **machine-generated educational aids** while preserving verbatim ratio decidendi and official judgment source URLs.

---

## 2. Constitutional Precedent Hierarchy & Article 141

Under the Indian constitutional framework, the doctrine of *stare decisis* operates hierarchically:

```
                          Supreme Court of India
                      (Apex Court of the Republic)
                                  |
              [Article 141: Law declared by Supreme Court
               is binding on ALL courts within India]
                                  |
        +-------------------------+-------------------------+
        |                                                   |
High Court of Judicature                           High Court of Judicature
      at Bombay                                           at Delhi
  - Binding on all subordinate courts                 - Binding on all subordinate courts
    and authorities in Maharashtra & Goa               and tribunals in NCT of Delhi
  - PERSUASIVE authority in Delhi                     - PERSUASIVE authority in Bombay
```

### Precedent Authority Rules in NyayaSaathi:
1. **`BINDING_NATIONWIDE`**:
   * Pronouncements of the **Supreme Court of India** (Article 141).
   * Irrespective of the citizen's State, a Supreme Court judgment (e.g., *Vishaka*, *Satish Chander Ahuja*, *D.K. Basu*) constitutes the binding law of the land.
2. **`BINDING_WITHIN_STATE`**:
   * Pronouncements of a **State High Court** within its territorial jurisdiction (e.g., Bombay High Court judgments within Maharashtra and Goa; Delhi High Court judgments within the NCT of Delhi).
   * Subordinate civil, criminal, labour, and consumer forums within the state are bound by it.
3. **`PERSUASIVE`**:
   * Pronouncements of a High Court when cited by a citizen or authority in a *different* State.
   * High Court judgments carry significant persuasive weight but are not strictly binding outside their territorial borders.

---

## 3. Database Schema & Data Modeling

Judicial precedents are stored across three specialized PostgreSQL tables with pgvector integration:

```
  +-------------------------------------------------------+
  |              public.court_judgments                   |
  |-------------------------------------------------------|
  | id: UUID PRIMARY KEY                                  |
  | case_title: TEXT (e.g. Vishaka v. State of Rajasthan) |
  | citation: TEXT (e.g. (1997) 6 SCC 241)                |
  | court_name: TEXT (e.g. Supreme Court of India)        |
  | court_level: 'SUPREME_COURT' | 'HIGH_COURT'           |
  | precedent_authority: 'BINDING_NATIONWIDE' | ...       |
  | decision_date: DATE                                   |
  | bench: TEXT (Judges on the coram)                     |
  | ratio_decidendi: TEXT (Core binding principle)        |
  | summary_facts: TEXT                                   |
  | issues: TEXT[]                                        |
  | subsequent_treatment: TEXT (e.g. Overruled, Followed) |
  | is_summary_machine_generated: BOOLEAN DEFAULT TRUE    |
  | source_url: TEXT (Official HTTPS SCI / HC link)       |
  | checksum: TEXT (SHA-256)                              |
  +-------------------------------------------------------+
          |                                   |
          v 1:N                               v 1:N
  +--------------------------------+  +-------------------------------------+
  | public.judgment_statute_links  |  |      public.judgment_chunks         |
  |--------------------------------|  |-------------------------------------|
  | id: UUID PRIMARY KEY           |  | id: UUID PRIMARY KEY                |
  | judgment_id: UUID FK           |  | judgment_id: UUID FK                |
  | act_title: TEXT                |  | content: TEXT (Verbatim paragraph)  |
  | provision_cited: TEXT          |  | paragraph_number: INT               |
  | relationship_type: TEXT        |  | chunk_type: 'RATIO' | 'HOLDING'     |
  |   ('INTERPRETED', 'UPHELD',    |  | embedding: vector(384) [pgvector]   |
  |    'ORIGIN_OF_LEGISLATION')    |  +-------------------------------------+
  +--------------------------------+
```

---

## 4. Dedicated RAG Retrieval Channel

In `ai-engine/src/services/ragService.js`, judicial precedent retrieval is maintained as an independent pipeline step via `caseLawService.retrieveCaseLaw(query, options)`:

```javascript
// Step 5 & 6: Statutory Retrieval (Payment of Wages, POSH, Constitution)
const retrievedProvisions = await legalService.retrieve(searchQuery, classifiedIntent, 4);

// Step 7: Distinct Precedent Channel (Never merged into statutory text)
const caseLawPrecedents = await caseLawService.retrieveCaseLaw(searchQuery, { limit: 2 });
```

### Response Guarantee:
* The LLM prompt and final API response maintain strict separation:
  * `citations`: Official verified statutory sections (Act, Section Number, Simplified Meaning).
  * `precedents`: Judicial interpretations (Court, Case Title, Bench, Ratio Decidendi, Official PDF URL, Binding/Persuasive Label).
* Citizens can immediately distinguish what **Parliament or the Legislature enacted** vs. how the **Supreme Court or High Court interpreted** it.
