# NyayaSaathi (न्यायसाथी) — Register of Outdated, Repealed, and Transitional Laws
**Version**: 1.0.0 (Master Audit)  
**Date**: November 15, 2026  
**Status**: ACTIVE VERIFICATION REGISTER  

---

## 1. Master Outdated Law Inventory

The following table records every legal provision, citation, or prompt template identified during the forensic audit that is repealed, superseded, partially commenced, or contains obsolete statutory references.

| Record ID / Scope | Act / Rule Name | Section / Provision | Current Legal Status | Previous Legal Status | Amendment or Repeal Information | Effective Date | Jurisdiction | Official Source | Required Correction | Current Retrieval Behavior |
|---|---|---|---|---|---|---|---|---|---|---|
| **OUT-001** | Indian Penal Code, 1860 (Act 45 of 1860) | Section 498A (Cruelty by Husband or Relatives) | **REPEALED (SAVED FOR PAST OFFENSES)** | IN_FORCE | Repealed by Section 358(1) of Bharatiya Nyaya Sanhita, 2023 (Act 45 of 2023). Saved for offenses committed prior to 01-07-2024. | 01-07-2024 | Central / India | [BNS 2023 - eGazette](https://egazette.gov.in) | Cite **Section 85, Bharatiya Nyaya Sanhita, 2023** as primary current law. Note IPC 498A savings for pre-July 2024 incidents. | Cites pure IPC 498A in fallback prompts (`llmService.js`). |
| **OUT-002** | Code of Criminal Procedure, 1973 (Act 2 of 1974) | Section 41 (Arrest without warrant) | **REPEALED (SAVED FOR PAST PROCEEDINGS)** | IN_FORCE | Repealed by Section 531(1) of Bharatiya Nagarik Suraksha Sanhita, 2023 (Act 46 of 2023). Saved for pending proceedings. | 01-07-2024 | Central / India | [BNSS 2023 - eGazette](https://egazette.gov.in) | Cite **Section 35, Bharatiya Nagarik Suraksha Sanhita, 2023**. | Cites CrPC Section 41 in `llmService.js` line 68. |
| **OUT-003** | Code of Criminal Procedure, 1973 (Act 2 of 1974) | Section 50 (Information of grounds of arrest & bail right) | **REPEALED (SAVED FOR PAST PROCEEDINGS)** | IN_FORCE | Repealed by Section 531(1) of Bharatiya Nagarik Suraksha Sanhita, 2023. | 01-07-2024 | Central / India | [BNSS 2023 - eGazette](https://egazette.gov.in) | Cite **Section 47, Bharatiya Nagarik Suraksha Sanhita, 2023**. | Cites CrPC Section 50 in `llmService.js` line 69. |
| **OUT-004** | Code of Criminal Procedure, 1973 (Act 2 of 1974) | Section 57 (Production before Magistrate within 24 hours) | **REPEALED (SAVED FOR PAST PROCEEDINGS)** | IN_FORCE | Repealed by Section 531(1) of BNSS, 2023. Re-enacted as Section 58 BNSS (alongside Art 22(2)). | 01-07-2024 | Central / India | [BNSS 2023 - eGazette](https://egazette.gov.in) | Cite **Section 58, Bharatiya Nagarik Suraksha Sanhita, 2023** and **Article 22(2)** of the Constitution. | Cites CrPC 57 in `llmService.js` and `rightsDiscoveryService.js`. |
| **OUT-005** | Indian Penal Code, 1860 (Act 45 of 1860) | Section 405/406 (Criminal breach of trust by employer) | **REPEALED (SAVED FOR PAST OFFENSES)** | IN_FORCE | Repealed by Section 358(1) of BNS, 2023. Re-enacted as Section 316 BNS. | 01-07-2024 | Central / India | [BNS 2023 - eGazette](https://egazette.gov.in) | Cite **Section 316, Bharatiya Nyaya Sanhita, 2023**. | Cites generic IPC for breach of trust in `llmService.js` line 16. |
| **OUT-006** | Consumer Protection Act, 1986 (Act 68 of 1986) | Whole Act | **REPEALED** | IN_FORCE | Repealed by Section 107 of Consumer Protection Act, 2019 (Act 35 of 2019) vide S.O. 2351(E). | 20-07-2020 | Central / India | [Consumer Protection Act, 2019](https://consumeraffairs.nic.in) | Ensure no legacy 1986 Act citations appear. Always cite **Consumer Protection Act, 2019**. | Already resolved in database, but historical queries must correctly acknowledge 1986 Act for pre-2020 disputes. |
| **OUT-007** | Payment of Wages Act, 1936 (Act 4 of 1936) | Whole Act | **IN_FORCE (OPERATIVE STATUTE; SCHEDULED FOR REPEAL UPON NOTIFICATION)** | IN_FORCE | Code on Wages 2019 enacted (Act 29 of 2019). Section 69 repeals 1936 Act once notified, but Section 69 is **NOT COMMENCED**. Act remains operational in practice. | Pending notification under Sec 1(3) Code on Wages | Central / Concurrent | [Ministry of Labour & Employment](https://labour.gov.in) | Tag as `IN_FORCE_OPERATIVE`. Do NOT tell citizens that Payment of Wages Act is dead. Highlight concurrent presence of Code on Wages 2019. | Correctly cited in DB and mock provider, but lacks explicit transitional status badge. |
| **OUT-008** | Minimum Wages Act, 1948 (Act 11 of 1948) | Whole Act | **IN_FORCE (OPERATIVE STATUTE; SCHEDULED FOR REPEAL UPON NOTIFICATION)** | IN_FORCE | Code on Wages 2019 enacted. Section 69 repeal clause not yet notified. Operative state minimum wage notifications govern wage floors. | Pending notification under Sec 1(3) Code on Wages | Central / Concurrent | [Chief Labour Commissioner](https://clc.gov.in) | Tag as `IN_FORCE_OPERATIVE`. Ingest Section 3, 12, 20 into DB. | Act exists in `legal_acts`, but has **zero active sections** in `legal_sections`. |
| **OUT-009** | Code on Wages, 2019 (Act 29 of 2019) | Section 15, 16, 17, 18, 43, 45, 69 | **ENACTED — NOT YET FULLY COMMENCED NATIONWIDE** | DRAFT | Enacted 08-08-2019. Notification S.O. 3772(E) dated 18-12-2019 commenced only Section 42(1)-(3), (10)-(11) (Central Advisory Board). Operational wage dispute clauses await synchronized notification. | Partially 18-12-2019; Remaining staged | Central / Concurrent | [eGazette S.O. 3772(E)](https://egazette.gov.in) | Label as `ENACTED_PARTIALLY_COMMENCED`. Distinguish operational sections from staged sections. | Listed as `PUBLISHED` without distinguishing uncommenced operational clauses. |
| **OUT-010** | Industrial Disputes Act, 1947 (Act 14 of 1947) | Section 33C (Recovery of money due) | **IN_FORCE (OPERATIVE STATUTE; SCHEDULED FOR REPEAL UPON NOTIFICATION)** | IN_FORCE | Industrial Relations Code, 2020 (Act 35 of 2020) enacted. Section 104 repeal not yet commenced. Section 33C petitions remain operative before Labour Courts. | Pending notification under Sec 1(3) IR Code 2020 | Central / Concurrent | [Ministry of Labour & Employment](https://labour.gov.in) | Tag as `IN_FORCE_OPERATIVE`. Maintain Section 33C recovery workflow. | Cites Section 33C, but lacks cross-reference to IR Code 2020 Section 104 savings. |

---

## 2. Key Audit Directives for Implementation

1. **Temporal Query Awareness**:
   - If a citizen asks: *"My employer delayed salary in 2022"*, the governing law is *Payment of Wages Act, 1936* and *Industrial Disputes Act, 1947*.
   - If a citizen asks: *"A crime was committed in May 2024"*, the governing law is *Indian Penal Code, 1860* and *CrPC, 1973* (saved under BNS 358 and BNSS 531).
   - If a citizen asks: *"A crime was committed in August 2024 or today in 2026"*, the governing law is *Bharatiya Nyaya Sanhita, 2023* and *Bharatiya Nagarik Suraksha Sanhita, 2023*.

2. **Zero False Repeal Assumptions**:
   - Never represent the 1936 Payment of Wages Act or 1948 Minimum Wages Act as extinct until the Central Government issues an official commencement notification under Section 1(3) and Section 69 of the Code on Wages, 2019.

3. **Prompt Hardening**:
   - Update `ai-engine/src/services/llmService.js` to eliminate all bare IPC/CrPC citations.
   - Synchronize prompt instructions to provide dual citations where transitional savings apply.
