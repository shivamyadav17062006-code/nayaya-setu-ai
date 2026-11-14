# NyayaSaathi (न्यायसाथी) — Constitution Versioning and Amendment Maintenance Protocol

**Protocol Version:** 1.0  
**Effective Date:** 2026-11-15  
**Document Custodian:** NyayaSaathi Legal Knowledge Engineering Group

---

## 1. Principles of Legal Versioning

Unlike conventional software code where newer versions simply overwrite older functions, statutory and constitutional law requires strict temporal tracking:
1. **As-Of Grounding:** Every legal advice snippet must declare its effective date (`asOfDate`).
2. **Traceable Amendments:** Insertions, substitutions, and omissions must be explicitly linked to their originating Constitutional Amendment Act (CAA) and effective commencement dates.
3. **Pending vs Enforced Distinctions:** Constitutional amendments that have received Presidential assent but await Gazette notification or delimitation milestones must be flagged with explanatory caveats.

---

## 2. Ingested Amendment Register (Key Amendments)

NyayaSaathi's current constitutional baseline incorporates all **106 Constitutional Amendments** through 1st May 2024:

| Amendment Act | Year | Affected Provisions | Impact on Citizen Rights |
| :--- | :--- | :--- | :--- |
| **42nd CAA** | 1976 | Preamble, Part IVA, Article 39A, Article 323A | Inserted "SOCIALIST", "SECULAR", "integrity"; created Fundamental Duties (Art 51A); mandated Equal Justice and Free Legal Aid (Art 39A). |
| **44th CAA** | 1978 | Articles 19, 21, 300A, 352, 359 | Deleted right to property from Part III (re-enacted as legal right under Art 300A); protected Articles 20 and 21 from suspension during emergencies. |
| **52nd CAA** | 1985 | Tenth Schedule | Introduced anti-defection law for MPs and MLAs. |
| **73rd & 74th CAAs** | 1992 | Parts IX & IXA, 11th & 12th Schedules | Constitutionalized rural Panchayati Raj and urban Municipal local governance. |
| **86th CAA** | 2002 | Article 21A, Article 45, Article 51A(k) | Made free and compulsory education a fundamental right for children aged 6 to 14. |
| **97th CAA** | 2011 | Article 19(1)(c), Article 43B, Part IXB | Added right to form co-operative societies. |
| **103rd CAA** | 2019 | Articles 15(6), 16(6) | Introduced 10% reservation for Economically Weaker Sections (EWS). |
| **106th CAA** | 2023 | Articles 330A, 332A, 334A | *Nari Shakti Vandan Adhiniyam:* Reserves one-third (33%) of seats for women in Lok Sabha and State Legislative Assemblies (effective after first census post-enactment and subsequent delimitation). |

---

## 3. Handling Conditional & Future-Enforced Amendments

The 106th CAA exemplifies a conditional enactment:
- **Assent:** Received Presidential assent on 28th September 2023.
- **Commencement Clause (Article 334A):** The reservation shall take effect after an exercise of delimitation is undertaken for this purpose after the relevant figures for the first census taken after the commencement of the Act have been published.
- **AI Engine Grounding Rule:** When querying Article 330A, the RAG engine explicitly provides:
  > *"Article 330A reserves 33% of seats for women in Lok Sabha. Note: Under Article 334A, this reservation takes effect after the first post-enactment census and subsequent delimitation exercise."*

This eliminates citizen confusion between enacted statutory law and pending operational commencement.

---

## 4. Maintenance and Automated Verification Schedule

1. **Bi-Monthly Source Polling:**
   - On the 1st of every alternate month, the automated script inspects `https://www.legislative.gov.in/amendments-to-the-constitution` for new Amendment enactments (e.g. 107th CAA).
2. **Corpus Integrity Verification:**
   - Daily automated CI/CD checks execute:
     ```bash
     node scripts/testConstitutionRAG.js
     ```
   - Verifies that `constitution_corpus.json` matches the recorded SHA-256 hash `012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16`.
3. **No Overwrites Rule:**
   - Any new amendment updates must create a staged diff in `data/constitution/` accompanied by updated integration tests before merging.
