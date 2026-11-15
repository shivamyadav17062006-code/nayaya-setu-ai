# NyayaSaathi (न्यायसाथी) — Commencement, Repeal, and Savings Tracking
**Version**: 1.0.0  
**Specification**: Central & State Commencement Notification Ledger  
**Date**: November 15, 2026  

---

## 1. Statutory Commencement & Repeal Architecture

Under the Indian legislative framework, an Act enacted by Parliament does not automatically take effect upon publication in the Gazette unless the Act explicitly provides that it shall come into force immediately. Most comprehensive codes contain an **appointed date clause** (typically Section 1(3)):

> *"It shall come into force on such date as the Central Government may, by notification in the Official Gazette, appoint; and different dates may be appointed for different provisions of this Code..."*

Similarly, repeal provisions (e.g., Section 69 of the Code on Wages, 2019; Section 104 of the Industrial Relations Code, 2020) are operative **only from the date appointed by the Central Government**.

Furthermore, under **Section 6 of the General Clauses Act, 1897**, the repeal of an enactment does not:
1. Revive anything not in force or existing at the time of repeal;
2. Affect the previous operation of any enactment so repealed or anything duly done or suffered thereunder;
3. Affect any right, privilege, obligation, or liability acquired, accrued, or incurred under any enactment so repealed;
4. Affect any penalty, forfeiture, or punishment incurred in respect of any offense committed against any enactment so repealed;
5. Affect any investigation, legal proceeding, or remedy in respect of any such right, privilege, obligation, liability, penalty, forfeiture, or punishment.

---

## 2. Master Tracking Ledger: Central Legislation

### A. The Criminal Law Reform (July 1, 2024)

| Instrument | Gazette Notification | Appointed Date | Repeal Effect | Savings Clause Protection |
|---|---|---|---|---|
| **Bharatiya Nyaya Sanhita, 2023 (Act 45 of 2023)** | Notification S.O. 850(E) dated 23-02-2024 | **July 1, 2024** | Repeals Indian Penal Code, 1860 (Act 45 of 1860) | **Section 358(2)**: Any act done or offense committed prior to 01-07-2024 remains governed and punishable under IPC 1860. |
| **Bharatiya Nagarik Suraksha Sanhita, 2023 (Act 46 of 2023)** | Notification S.O. 848(E) dated 23-02-2024 | **July 1, 2024** | Repeals Code of Criminal Procedure, 1973 (Act 2 of 1974) | **Section 531(2)**: Pending investigations, trials, appeals, and applications initiated prior to 01-07-2024 continue under CrPC 1973. |
| **Bharatiya Sakshya Adhiniyam, 2023 (Act 47 of 2023)** | Notification S.O. 849(E) dated 23-02-2024 | **July 1, 2024** | Repeals Indian Evidence Act, 1872 (Act 1 of 1872) | **Section 170(2)**: Admissibility and appreciation of evidence in proceedings initiated prior to 01-07-2024 preserved. |

---

### B. The Four Labour Codes

| Code Title | Presidential Assent Date | Commencement Notification Issued | Sections Commenced | Uncommenced Operative Clauses | Predecessor Operative Statute |
|---|---|---|---|---|---|
| **Code on Wages, 2019 (Act 29 of 2019)** | August 8, 2019 | **Notification S.O. 3772(E) dated 18-12-2019** | **Section 42(1), (2), (3), (10), (11)** (Central Advisory Board) | **Section 15-18** (Wage payment, deduction rules), **Section 43-45** (Claims authority), **Section 69** (Repeal clause) | **Payment of Wages Act, 1936** & **Minimum Wages Act, 1948** (`IN_FORCE_OPERATIVE`) |
| **Industrial Relations Code, 2020 (Act 35 of 2020)** | September 28, 2020 | None issued for operational provisions | None | **Whole Code** pending Central Government notification under Section 1(3) | **Industrial Disputes Act, 1947** & **Trade Unions Act, 1926** (`IN_FORCE_OPERATIVE`) |
| **Code on Social Security, 2020 (Act 36 of 2020)** | September 28, 2020 | Preliminary notification regarding unorganized worker data | Preliminary / Aadhaar clauses | **Section 16-164** (EPF, ESI, Maternity, Gratuity schemes, Repeal) | **EPF Act 1952**, **ESI Act 1948**, **Maternity Benefit Act 1961**, **Payment of Gratuity Act 1972** (`IN_FORCE_OPERATIVE`) |
| **Occupational Safety, Health and Working Conditions Code, 2020 (Act 37 of 2020)** | September 28, 2020 | None issued | None | **Whole Code** pending Central Government notification under Section 1(3) | **Factories Act, 1948**, **Contract Labour (R&A) Act, 1970**, **BOCW Act, 1996** (`IN_FORCE_OPERATIVE`) |

---

### C. Consumer Protection

| Instrument | Gazette Notification | Appointed Date | Repeal Effect | Savings Clause Protection |
|---|---|---|---|---|
| **Consumer Protection Act, 2019 (Act 35 of 2019)** | Notification S.O. 2351(E) dated 15-07-2020 & S.O. 2421(E) dated 23-07-2020 | **July 20, 2020** (Sections 2-107, except select e-commerce & mediation provisions which followed July 24, 2020) | Repeals Consumer Protection Act, 1986 (Act 68 of 1986) | **Section 107(2)**: Pending complaints before District Forum, State Commission, or National Commission continue under 1986 Act rules. |

---

## 3. Automated Legal Enforcement in NyayaSaathi

To prevent legal inaccuracies, NyayaSaathi's RAG and AI engines must enforce the following validation pipeline:

```
[Query Received]
       │
       ▼
[Identify Subject & Year]
       │
       ├── Case: Labour / Wages
       │     └── Check: Is Code on Wages Section 69 commenced?
       │           ├── NO ──► Cite Payment of Wages Act 1936 / Minimum Wages Act 1948 as Operative Law
       │           └── YES ─► Cite Code on Wages 2019 (with Section 69 savings)
       │
       ├── Case: Criminal / Arrest
       │     └── Check: Did event occur before July 1, 2024?
       │           ├── YES ─► Cite IPC 1860 / CrPC 1973 (Saved under BNS 358 / BNSS 531)
       │           └── NO ──► Cite BNS 2023 / BNSS 2023
       │
       └── Case: Consumer Dispute
             └── Check: Did complaint arise before July 20, 2020?
                   ├── YES ─► Consumer Protection Act, 1986
                   └── NO ──► Consumer Protection Act, 2019
```
