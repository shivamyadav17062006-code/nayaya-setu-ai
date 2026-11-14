# NyayaSaathi — RAG Evaluation & Grounding Benchmark Report

## 1. Evaluation Methodology

The NyayaSaathi RAG system was evaluated using an automated benchmark suite (`scripts/testRAGSystem.js`) testing end-to-end question answering, intent classification, pgvector semantic search, grounded statutory citation retrieval, and resilience under edge cases.

---

## 2. Evaluation Matrix across 7 Mandatory Legal Domains

All 7 core domains were evaluated with realistic citizen queries:

| Legal Domain | Citizen Test Query | Retrieved Act & Section | Grounding Result | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unpaid Wages** | *"My company has not paid my salary for 3 months. Can my employer withhold wages?"* | Payment of Wages Act, 1936 — **Section 5 & 15** | Grounded | **Passed** |
| **2. Domestic Violence** | *"Where can a woman get immediate protection against domestic violence under PWDVA?"* | Protection of Women from Domestic Violence Act, 2005 — **Section 3 & 12** | Grounded | **Passed** |
| **3. Consumer Complaints** | *"I received a defective refrigerator from an online shopping site and they refuse refund. How to file a consumer complaint on eDaakhil?"* | Consumer Protection Act, 2019 — **Section 35** | Grounded | **Passed** |
| **4. Workplace Harassment** | *"A female employee is facing sexual harassment at her office. How does the POSH Internal Complaints Committee handle complaints?"* | POSH Act, 2013 — **Section 4 & 9** | Grounded | **Passed** |
| **5. Legal Aid Eligibility** | *"Can an industrial worker or a woman get a free lawyer under Section 12 of Legal Services Authorities Act?"* | Legal Services Authorities Act, 1987 — **Section 12** | Grounded | **Passed** |
| **6. Tenant Rights** | *"My landlord locked my apartment and gave zero notice. What are tenant rights against unlawful eviction under Transfer of Property Act?"* | Transfer of Property Act, 1882 — **Section 106 & 108** | Grounded | **Passed** |
| **7. Constitutional Rights** | *"What are my fundamental rights under Article 14 and Article 21 of the Constitution of India?"* | Constitution of India, 1950 — **Article 14, 21 & 39A** | Grounded | **Passed** |

---

## 3. Database Citation Verification Results

Every citation returned by the pipeline was verified against canonical PostgreSQL records in Supabase (`legal_acts` and `legal_sections`).
- **Hallucinated Acts**: 0 (0%)
- **Hallucinated Sections**: 0 (0%)
- **Untrusted External URLs**: 0 (0%)
- **Citations with Verified Badges**: 100%

---

## 4. Edge Cases, Conflicting Sources & Degradation

### A. Non-Legal / Gibberish Query
- **Query**: `"xyz123 qwerty asdfghjkl quantum particle accelerator"`
- **Behavior**: System flags low similarity, provides general constitutional baseline under Article 39A, and provides statutory legal aid helpline (15100).
- **Result**: **Passed** (No crashes, no fabricated sections).

### B. Conflicting / Multi-Statute Query
- **Query**: `"Can my landlord withhold my salary and evict me without notice?"`
- **Behavior**: Normalizer and hybrid retrieval successfully identified cross-domain concepts, retrieving Transfer of Property Act protections while handling multiple statutory contexts coherently.
- **Result**: **Passed**.

---

## 5. Summary Scorecard

```text
================================================================
PHASE 10 EVALUATION SUMMARY: 11 Passed, 0 Failed (100% Pass Rate)
================================================================
1. Query Normalization & Acronym Expansion:       PASSED
2. Core Domain 1 (Unpaid Wages):                   PASSED
3. Core Domain 2 (Domestic Violence):              PASSED
4. Core Domain 3 (Consumer Complaints):            PASSED
5. Core Domain 4 (Workplace Harassment):           PASSED
6. Core Domain 5 (Legal Aid Eligibility):          PASSED
7. Core Domain 6 (Tenant Rights):                  PASSED
8. Core Domain 7 (Constitutional Rights):          PASSED
9. Database Record Verification:                   PASSED
10. Retrieval Failure State Handling:              PASSED
11. Conflicting Multi-Statute Handling:            PASSED
================================================================
```
