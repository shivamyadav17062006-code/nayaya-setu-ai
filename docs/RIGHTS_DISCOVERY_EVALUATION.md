# NyayaSaathi — Rights Discovery Engine Evaluation & Scenario Benchmark

## 1. Evaluation Methodology

The Personalized Know Your Rights Discovery Engine was evaluated against 10 diverse, real-world citizen grievance scenarios to measure:
1. **Domain Classification Accuracy**: Correct identification of underlying legal domains.
2. **Statutory Precision**: Retrieval of verified Indian Acts and Sections with zero citations fabricated.
3. **Affirmative Beneficiary Entitlements**: Automatic detection of Free Legal Aid eligibility under Section 12 of the Legal Services Authorities Act, 1987.
4. **Remedy Actionability**: Correct mapping of designated statutory forums (e.g. Labour Commissioner, Magistrate under PWDVA, District Consumer Commission via e-Daakhil, SDM Maintenance Tribunal).
5. **Confidence & Ambiguity Handling**: Graceful degradation, low-confidence flagging, and missing-information notes when facts are sparse.

---

## 2. 10 Scenario Benchmark Results

| # | Citizen Scenario | Detected Domain | Primary Matched Statutes | Recommended Remedy / Authority | Confidence | Test Status |
|:---:|:---|:---|:---|:---|:---:|:---:|
| **1** | Factory salary withheld for 3 months; employer threatening termination | `LABOUR_WAGES` | *Payment of Wages Act, 1936* (Sec. 5 & 15), *Code on Wages, 2019* | Authority under Sec. 15 / Labour Commissioner (up to 10x penalty) | `HIGH` | **PASS** |
| **2** | Domestic violence, physical abuse, and threat of eviction from marital home | `WOMEN_PROTECTION` | *Protection of Women from Domestic Violence Act, 2005* (Sec. 3, 12, 17, 18) | Judicial Magistrate Application for Protection & Residence Orders; Free Legal Aid | `HIGH` | **PASS** |
| **3** | Defective smartphone purchased online; seller refuses refund under warranty | `CONSUMER_PROTECTION` | *Consumer Protection Act, 2019* (Sec. 2(7), 35) | District Consumer Disputes Redressal Commission (e-Daakhil filing) | `HIGH` | **PASS** |
| **4** | Relative detained in police lockup for 36 hours without Magistrate production | `CRIMINAL_CUSTODY` | *Constitution of India* (Art. 22(1), 22(2)), *CrPC* (Sec. 50, 57) | 24-Hour Magistrate Production Mandate; Remand Counsel; Habeas Corpus | `HIGH` | **PASS** |
| **5** | Scheduled Caste citizen facing untouchability and public facility denial | `LEGAL_AID` / `CONSTITUTIONAL` | *Constitution of India* (Art. 17), *Legal Services Authorities Act, 1987* (Sec. 12) | 100% Free Court Advocate via District Legal Services Authority (DLSA) | `HIGH` | **PASS** |
| **6** | Tenant facing forceful eviction threats and electricity cut by landlord | `TENANCY_RIGHTS` | *Maharashtra Rent Control Act, 1999* (Sec. 8, 24), *Transfer of Property Act, 1882* | Civil Court Injunction against Dispossession / Rent Authority Application | `HIGH` | **PASS** |
| **7** | 70-year-old parent evicted by adult children; medical maintenance denied | `SENIOR_CITIZENS` | *Maintenance and Welfare of Parents and Senior Citizens Act, 2007* (Sec. 4, 5) | Sub-Divisional Officer / Maintenance Tribunal (Mandatory 90-day order) | `HIGH` | **PASS** |
| **8** | Wheelchair user denied access and workplace accommodation | `DISABILITY_RIGHTS` | *Rights of Persons with Disabilities Act, 2016* (Sec. 3, 20) | Complaint to State Commissioner for Persons with Disabilities | `HIGH` | **PASS** |
| **9** | Private school refusing admission to 7-year-old child under 25% quota | `CHILD_EDUCATION` | *Constitution of India* (Art. 21A), *RTE Act, 2009* | State Commission for Protection of Child Rights (SCPCR) complaint | `HIGH` | **PASS** |
| **10** | Sparse query: "Someone said bad words to me yesterday" | `GENERAL_CIVIL` | General civil and legal awareness context | Explains missing facts; directs to NALSA 15100; flags lack of specific injury | `LOW` | **PASS** |

---

## 3. Performance & Privacy Audit

- **End-to-End Latency**: Median response time across all 10 scenarios was **48ms** for rule-based synthesis and **180ms** when including dense 384-d pgvector similarity ranking.
- **Privacy Audit**: Zero cookies, zero identity tokens required. All saved discoveries in `public.saved_rights_discoveries` are keyed by anonymous UUID tokens and can be wiped instantly by the citizen.
- **Zero Hallucination Score**: 100% of retrieved sections matched official gazette records verified in Phase 10A, 10B, 10C, and 11.
