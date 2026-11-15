# NyayaSaathi (न्यायसाथी) — Comprehensive Legal Accuracy Audit
**Date**: November 15, 2026  
**Auditor**: Principal Legal Technology Architect & Technical Lead  
**Applicable Framework**: Constitution of India, Central Legislation (India Code), Official Gazette (e-Gazette), NALSA Directives, State Legislative Repositories  

---

## 1. Executive Summary & Objective

NyayaSaathi is a public Know Your Rights (KYR) legal awareness platform for Indian citizens. Because citizens rely on this platform to understand their fundamental rights, remedies, procedural timelines, and legal aid eligibility, providing outdated, uncommenced, or repealed legal citations can cause severe real-world prejudice (e.g., missed limitation periods, filing under repealed procedural codes, or misidentifying competent statutory authorities).

This audit conducts an exhaustive, forensic inspection across all 24 architectural layers of NyayaSaathi to identify:
1. Repealed legislation currently cited as operational.
2. Newly enacted legislation (such as the Criminal Sanhitas of 2023 and the Four Labour Codes) incorrectly presented as either non-existent, fully operational, or completely uncommenced.
3. Hardcoded citations and fallback mock responses carrying obsolete sections (e.g., IPC 498A, CrPC 41/50/57, old Consumer Protection 1986).
4. Procedural workflows and grievance portals lacking version awareness or temporal jurisdiction.
5. Missing statutory sections in the database for critical central acts (Criminal Law, RTE 2009, Minimum Wages 1948).

---

## 2. Forensic Audit Across 24 Architectural Layers

| # | Codebase / Data Layer | Inspection Scope & File Paths | Findings & Vulnerabilities Identified | Severity | Required Modernization Action |
|---|---|---|---|---|---|
| **1** | **Legal Acts Database** | `backend/prisma/schema.prisma`, `legal_acts` table | 30 acts cataloged. Only basic status (`ACTIVE`/`PENDING`) supported. No temporal validity fields (commencement date, repeal date, savings clause link, partial commencement flags). | **CRITICAL** | Extend schema with 14-state lifecycle model, temporal validity timestamps, and gazette notification references. |
| **2** | **Legal Sections Database** | `legal_sections` table (96 records) | 45 Constitutional Articles, but **zero sections** for Bharatiya Nyaya Sanhita 2023, Bharatiya Nagarik Suraksha Sanhita 2023, RTE Act 2009, or Minimum Wages 1948. | **CRITICAL** | Ingest verified operative sections for BNS 2023, BNSS 2023, RTE 2009, Minimum Wages 1948, and the 4 Labour Codes. |
| **3** | **Constitution Data** | `scripts/buildConstitutionCorpus.js`, `legal_sections` | 45 Articles verified and in place (Articles 14, 19, 21, 21A, 22, 23, 24, 32, 39A, 226, 300A). Accurate and well-grounded in legislative.gov.in. | **PASS** | Maintain current constitutional corpus; add amendment tracking for recent CAAs. |
| **4** | **Beneficiary Categories** | `beneficiaries` table (12 categories) | Women, Children, Workers, SC/ST, Persons with Disabilities, Senior Citizens, Consumers. Aligned with Section 12 LSAA 1987. | **LOW** | Link each beneficiary category directly to its statutory non-income exemption clause. |
| **5** | **Right Categories** | `right_categories` table (10 categories) | 10 categories cataloged. Criminal category mentions BNSS & BNS in description, but has zero active statutory sections in the database. | **HIGH** | Populate statutory sections under Criminal Law, Labour Rights, and Child Rights. |
| **6** | **Complaint Workflows** | `complaint_workflows`, `scripts/seedWorkflows.js` | 7 active workflows. Labour workflow cites Payment of Wages Act 1936 and Code on Wages 2019, but lacks temporal distinction on whether wage code is operative for the dispute. | **HIGH** | Add version-aware procedural routing (differentiating legacy operative procedure vs post-commencement portal). |
| **7** | **Legal Aid Eligibility** | `legal_aid_income_limits`, `legalAidEligibilityService.js` | 35 state income limits verified against official SLSA rules. Correctly handles statutory non-income exemptions under Sec 12. | **PASS** | Maintain quarterly verification dates and gazette notification links. |
| **8** | **Legal Aid Providers** | `legal_aid_providers` table (14 verified) | NALSA 15100, SLSAs, and DLSAs cataloged. Official links verified. | **PASS** | Add explicit verification badge and DLSA taluk clinic references. |
| **9** | **Legal Remedies** | `legal_remedies` table (7 records) | Section 15 Payment of Wages, Sec 12 PWDVA, Sec 35 Consumer Protection, Sec 33C Industrial Disputes Act. | **MEDIUM** | Modernize criminal remedies to reference Section 173/175/528 BNSS alongside legacy CrPC Section 154/156(3)/482. |
| **10** | **Legal Document Templates** | `frontend/src/pages/DocumentAssistant.jsx` | Salary demand notice, RTI application, POSH complaint, consumer notice. Valid statutory references. | **LOW** | Add BNS/BNSS notice variants for criminal complaints and cyber fraud grievances. |
| **11** | **AI System Prompts** | `ai-engine/src/utils/prompts.js` | Strict zero-hallucination prompts in place. However, fallback directive tells AI to inject Article 39A and Sec 12 LSAA when retrieval fails. | **HIGH** | Remove mandatory insertion of generic Article 39A when specific statute retrieval fails; preserve uncertainty per Part 12. |
| **12** | **RAG Retrieval Prompts** | `ai-engine/src/services/ragService.js` | Uses pgvector similarity search, but lacks temporal filtering (`event_date`, `applicable_year`) and legal status filtering (`IN_FORCE`, `REPEALED`). | **CRITICAL** | Implement version-aware retrieval: filter chunks by jurisdiction, status, and historical year. |
| **13** | **Gemini Generation Prompts** | `ai-engine/src/services/llmService.js` | Prompts handle multilingual translation well, but system prompt lacks explicit instructions on distinguishing draft rules from final rules. | **MEDIUM** | Update prompt contract to explicitly distinguish enacted codes, uncommenced rules, and operative legacy acts. |
| **14** | **Hardcoded Citations** | `ai-engine/src/services/llmService.js` (MOCK_RESPONSES) | Hardcodes IPC Section 498A, CrPC Section 41, 50, 57, and IPC criminal breach of trust. | **CRITICAL** | Replace pure legacy IPC/CrPC citations with Bharatiya Nyaya Sanhita (BNS 2023) and Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) plus savings notes. |
| **15** | **Mock Legal Answers** | `ai-engine/src/providers/mockProvider.js` | Uses dual citations (BNS 85 / IPC 498A, BNSS 57 / CrPC 57). Correctly updated in recent turns. | **PASS** | Ensure all 15 supported languages reflect synchronized dual citations. |
| **16** | **Seed Files** | `backend/prisma/seed.js`, `scripts/seed*.js` | Seeds currently define 30 acts and 96 sections. Missing BNS/BNSS seed chunks. | **HIGH** | Author consolidated seed scripts for BNS 2023, BNSS 2023, and Labour Code status tracking. |
| **17** | **Static JSON Legal Data** | `frontend/src/pages/Rights.jsx`, `scripts/buildStateRegistry.js` | Contains 36 State/UT profiles. Verified traceable portals. | **PASS** | Ensure state wage rule status (draft vs final) is accurately tagged. |
| **18** | **Frontend Legal Information** | `frontend/src/pages/RightsCategory.jsx`, `Chat.jsx` | UI presents Act cards, but lacks "View Original Law", "Why this law applies", and legal validity status badges (`IN_FORCE`, `PARTIALLY_COMMENCED`). | **HIGH** | Upgrade Rights Library and Chat UI to display legal status badges and original gazette links. |
| **19** | **Backend Legal Rules** | `backend/src/controllers/rightsController.js`, `aidController.js` | Rules enforce accurate statutory limits. Lacks an explicit version-checking endpoint. | **MEDIUM** | Add `/api/rights/versions` and `/api/rights/validate-citation` endpoints. |
| **20** | **AI Legal Reasoning Service** | `backend/src/services/aiService.js` | Node.js AI service handles greeting and fallback. Cites BNS 85 / IPC 498A. | **PASS** | Align with updated citation validator. |
| **21** | **Vector Embeddings** | `legal_chunks` table (131 chunks) | Chunks embed existing acts/sections. Chunks lack metadata fields for `legal_status`, `effective_date`, `repealed_date`, and `jurisdiction`. | **CRITICAL** | Re-index chunks with version-aware metadata and add pgvector filtering by legal status. |
| **22** | **Legal Source Metadata** | `legal_acts`, `legal_sections` | `sourceUrl` points to indiacode.nic.in and egazette.gov.in. Good quality URLs. | **PASS** | Add `checksum`, `gazette_notification_number`, and `last_verified_at` to every record. |
| **23** | **Documentation** | `docs/*.md` (75 documents) | Extensive architectural documentation. Missing master registers required by Part 14. | **HIGH** | Generate all 12 required master documents specified in Part 14. |
| **24** | **Translations** | `ai-engine/src/providers/mockProvider.js`, `i18n.js` | Hindi, Marathi, and English supported. Statutory section numbers preserved in Indic scripts. | **PASS** | Maintain section number preservation across all translation workflows. |

---

## 3. High-Risk Legal Vulnerabilities in Detail

### Vulnerability 1: The Criminal Law Transition (IPC/CrPC vs BNS/BNSS)
- **Status in India**: On July 1, 2024, the Parliament of India brought into effect:
  1. **Bharatiya Nyaya Sanhita, 2023 (BNS)** (Act No. 45 of 2023) — repealing Indian Penal Code, 1860.
  2. **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** (Act No. 46 of 2023) — repealing Code of Criminal Procedure, 1973.
  3. **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (Act No. 47 of 2023) — repealing Indian Evidence Act, 1872.
- **Savings Clause Reality**: Under Section 358 of BNS and Section 531 of BNSS, offenses committed prior to July 1, 2024 continue to be investigated, tried, and punished under IPC 1860 and CrPC 1973.
- **NyayaSaathi Codebase Defect**: `ai-engine/src/services/llmService.js` was citing pure IPC 498A and CrPC 41/50/57 without BNS/BNSS, presenting repealed statutes as the sole law for present-day offenses.
- **Required Fix**: Dual statutory grounding: Primary citation under BNS/BNSS for events on or after July 1, 2024; legacy saving citation under IPC/CrPC for events prior to July 1, 2024.

### Vulnerability 2: The Four Labour Codes Commencement Complexity
- **Status in India**: Parliament enacted the Four Labour Codes between 2019 and 2020:
  1. *Code on Wages, 2019* (Act No. 29 of 2019)
  2. *Industrial Relations Code, 2020* (Act No. 35 of 2020)
  3. *Code on Social Security, 2020* (Act No. 36 of 2020)
  4. *Occupational Safety, Health and Working Conditions Code, 2020* (Act No. 37 of 2020)
- **Commencement Reality**: The overarching repeal sections (Section 69 of Code on Wages, Section 104 of IR Code, Section 164 of Social Security Code, Section 143 of OSH Code) have **not been notified for full nationwide commencement**. Only preliminary advisory provisions (Section 42 of Code on Wages vide S.O. 3772(E)) have been enforced.
- **Legal Operational Reality**: The *Payment of Wages Act, 1936*, *Minimum Wages Act, 1948*, *Payment of Bonus Act, 1965*, *Equal Remuneration Act, 1976*, *Industrial Disputes Act, 1947*, and *Employees' Provident Funds Act, 1952* remain the **operative statutes** under which Labour Courts, Conciliation Officers, and Payment of Wages Authorities adjudicate claims today.
- **NyayaSaathi Codebase Defect**: Presenting Code on Wages 2019 as having completely replaced the Payment of Wages Act 1936 would mislead a worker attempting to file Form A before the Assistant Labour Commissioner.
- **Required Fix**: Explicitly label Code on Wages 2019 as `ENACTED_PARTIALLY_COMMENCED`, cite Payment of Wages Act 1936 as `IN_FORCE_OPERATIVE`, and provide citizens with the exact legal status and competent authority.

---

## 4. Initial Audit Findings Summary
- **Total Known Legal Records**: 30 Acts/Rules, 96 Sections, 131 Legal Chunks, 7 Workflows, 35 State Income Limits, 14 Providers.
- **Outdated / High-Risk References Detected**: 8 instances in LLM service prompts, fallback templates, and discovery rules.
- **Missing Priority Statutory Sections**: BNS 2023 (Sec 85, 316), BNSS 2023 (Sec 35, 47, 57, 58), RTE 2009 (Sec 12), Minimum Wages 1948 (Sec 3, 12, 20).
- **Architecture Readiness**: Excellent modern JavaScript ES Module stack; database schema requires non-destructive migration to support the 14-state legal lifecycle model and temporal validity.
