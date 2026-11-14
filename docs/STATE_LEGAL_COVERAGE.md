# State and Union Territory Legal Coverage Framework

## 1. Executive Summary

NyayaSaathi's Know Your Rights (KYR) platform covers both the Union (Central) statutory framework and Indian State and Union Territory legislation. Under the Constitution of India, citizens' daily legal interactions—including employment conditions in commercial establishments, residential tenancy agreements, time-bound delivery of public services, and free legal aid income eligibility—are primarily governed by State enactments and State subordinate rules.

This document outlines the constitutional division of legislative powers, our multi-tier jurisdiction coverage architecture, and the honest coverage tracker for all **28 States** and **8 Union Territories** of India.

---

## 2. Constitutional Division of Legislative Powers

Under **Article 246** read with the **Seventh Schedule** of the Constitution of India, legislative competence is distributed across three lists:

```
                          Constitution of India
                               Article 246
                                    |
       +----------------------------+----------------------------+
       |                                                         |
  List I: Union List                   List II: State List                   List III: Concurrent List
  (Parliament Exclusively)              (State Legislatures)                 (Parliament + States)
  - Defense, Foreign Affairs           - Public Order & Police              - Criminal Law & Procedure
  - Banking & Insurance                - Public Health & Sanitation         - Labour & Industrial Disputes
  - Inter-state Trade & Commerce       - Agriculture & Land Revenue         - Contracts & Civil Procedure
  - Supreme Court & High Courts        - Local Government & Tenancy         - Economic & Social Planning
                                       - Shops & Commercial Outlets         - Legal Aid (LSAA 1987)
```

### Critical Implications for Citizen Rights:
1. **Shops & Commercial Establishments**: Governed strictly by State Acts (e.g., *Maharashtra Shops and Establishments Act 2017*, *Delhi Shops and Establishments Act 1954*, *Karnataka Shops and Commercial Establishments Act 1961*). Daily working hours, overtime wages (2x multiplier), mandatory weekly holidays, and dismissal notices vary by State.
2. **Tenancy and Rent Control**: Governed by State enactments (e.g., *Maharashtra Rent Control Act 1999*, *Delhi Rent Control Act 1958*). Summary eviction procedures for residential leave-and-license agreements operate under State Competent Authorities.
3. **Right to Public Services / Citizen Charters**: States have enacted dedicated statutory service delivery laws (e.g., *Karnataka Sakala Act 2011*, *Delhi Right to Citizen Services Act 2011*, *Maharashtra Right to Public Services Act 2015*) providing daily financial compensation to citizens when government offices delay certificates or utility connections.
4. **State Legal Aid (SLSA & DLSA)**: While the *Legal Services Authorities Act, 1987* is a Central enactment, **Section 12(h)** delegates the annual income ceiling for free legal aid to each respective State Government (ranging from ₹1,00,000/year in UP to ₹3,00,000/year in Maharashtra, Delhi, and Karnataka).

---

## 3. Jurisdiction Classification & Status

India comprises **36 administrative jurisdictions**: 28 States, 3 Union Territories with Legislative Assemblies, and 5 Union Territories without Legislative Assemblies.

| Jurisdiction Category | Count | Legislative Authority | High-Impact Statutory Focus |
|:---|:---:|:---|:---|
| **States** | 28 | State Legislative Assembly (Vidhan Sabha / Vidhan Parishad) | State Shops Act, Rent Control, Land Revenue, SLSA Rules, RTPS |
| **UTs with Assembly** (Delhi, Puducherry, J&K) | 3 | Legislative Assembly (subject to Article 239A / 239AA limits) | Shops Act, Citizen Services Charters, Urban Rent Control |
| **UTs without Assembly** (Chandigarh, Ladakh, Andaman, etc.) | 5 | Central Parliament & Presidential Regulations | Extended State Acts (e.g. Punjab Acts in Chandigarh), MHA notifications |

---

## 4. Honest Live Coverage Audit

NyayaSaathi strictly adheres to **Rule 7 of AGENTS.md** (Zero Hallucination & Honest Verification). We never present catalogued or unverified states as fully ingested.

| Metric | Status | Verification Traceability |
|:---|:---:|:---|
| **Total Indian Jurisdictions** | **36** (28 States, 8 UTs) | Mapped in `data/jurisdiction/state_ut_registry.json` |
| **Official Portals Mapped** | **36 / 36 (100%)** | Government portals, Legislative Assemblies, e-Gazettes |
| **SLSA Legal Aid Rules Cited** | **36 / 36 (100%)** | Verified statutory rule citations and income ceilings |
| **Verified Pilot States Ingested** | **3 States** (`MH`, `DL`, `KA`) | 9 Acts & Rules, 21 dense vector chunks embedded |
| **Catalogued Pending Ingestion** | **33 Jurisdictions** | Source URLs and SLSA guidelines active; vector ingestion queued |
| **Total Ingested Knowledge Base** | **127 Chunks** | 80 Constitutional + 26 Central + 21 State chunks (`vector(384)`) |

---

## 5. Pilot States Deep Ingestion Summary

### 1. Maharashtra (`MH`)
* **State Acts Ingested**:
  * *Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017* (Section 6, 13, 15, 18).
  * *Maharashtra Rent Control Act, 1999* (Section 8, 15, 24).
* **Subordinate Rules**:
  * *Maharashtra State Legal Services Authority Rules, 1998* (Rule 14 — ₹3,00,000 income ceiling).
* **Statutory Highlights**: Overtime pay at 2x rate; 1 earned leave per 20 days worked + 8 casual leaves; women night-shift protection with employer-provided transportation; 90-day eviction notice protection.

### 2. Delhi (NCT) (`DL`)
* **State Acts Ingested**:
  * *Delhi Shops and Establishments Act, 1954* (Section 8, 15, 22, 30).
  * *Delhi (Right of Citizen to Time Bound Delivery of Services) Act, 2011* (Section 3, 7).
* **Subordinate Regulations**:
  * *Delhi State Legal Services Authority Regulations, 2018* (Regulation 7 — ₹3,00,000 income ceiling).
* **Statutory Highlights**: Wages due by 7th of succeeding month; mandatory 1-month dismissal notice or wages in lieu; compensatory penalty of up to ₹200/day (max ₹5,000) for delayed citizen certificates deducted from government officer's salary.

### 3. Karnataka (`KA`)
* **State Acts Ingested**:
  * *Karnataka Shops and Commercial Establishments Act, 1961* (Section 7, 12, 39).
  * *Karnataka Guarantee of Services to Citizens Act (Sakala), 2011* (Section 4, 8).
* **Subordinate Rules**:
  * *Karnataka State Legal Services Authority Rules, 1996* (Rule 13 — ₹3,00,000 income ceiling).
* **Statutory Highlights**: 9 hours/day, 48 hours/week maximum work limit; mandatory weekly rest with prohibition on employer contact; 1-month termination notice for 6+ months service; Sakala 15-digit GSC tracking with daily default compensation.
