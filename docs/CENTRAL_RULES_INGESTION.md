# NyayaSaathi (न्यायसाथी) — Central Subordinate Rules & Regulations Ingestion

**Document Type:** Technical Ingestion Architecture & Subordinate Legislation Registry  
**Audit Date:** 2026-11-15  
**Version:** 2024.2  
**Implementation Standard:** Node.js ES Modules + Prisma + PostgreSQL pgvector

---

## 1. Principles of Subordinate Legislation Modeling

In Indian administrative jurisprudence, Acts of Parliament provide broad substantive rights and powers, while **Subordinate Legislation** (Rules, Regulations, Orders, Bye-laws) prescribes the procedural mechanisms, deadlines, standard application forms, and redressal authorities.

NyayaSaathi links every subordinate enactment directly to its enabling Act:
```
Primary Enacting Act (e.g. Consumer Protection Act, 2019)
    │
    ├── Section 101: Power of Central Government to make rules
    │       │
    │       ▼
    ├── Subordinate Rule: Consumer Protection (E-Commerce) Rules, 2020
    │       ├── Rule 4: Grievance Officer Appointment (48-hour acknowledgment)
    │       └── Rule 6: Prohibition of Deceptive Seller Practices
    │
    └── Section 1(3): Commencement Notification
            └── Notification S.O. 2351(E) (Effective from 20-07-2020)
```

---

## 2. Ingested Subordinate Rules & Regulations

| Subordinate Legislation | Document Type | Enabling Parent Act | Enabling Section | Gazette Ref | Ministry | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment of Wages (Procedure) Rules, 1937** | RULES | Payment of Wages Act, 1936 | Section 26 | Central Rules 1937 | Labour | PUBLISHED |
| **Protection of Women from Domestic Violence Rules, 2006** | RULES | PWDVA, 2005 | Section 37 | G.S.R. 644(E) | WCD | PUBLISHED |
| **Sexual Harassment of Women at Workplace Rules, 2013** | RULES | POSH Act, 2013 | Section 29 | G.S.R. 769(E) | WCD | PUBLISHED |
| **Consumer Protection (E-Commerce) Rules, 2020** | RULES | Consumer Protection Act, 2019 | Section 101 | G.S.R. 462(E) | Consumer Affairs | PUBLISHED |
| **NALSA (Free & Competent Legal Services) Regulations, 2010** | REGULATIONS | Legal Services Authorities Act, 1987 | Section 29 | F. No. L/28/09 | Law & Justice | PUBLISHED |
| **Right to Information Rules, 2012** | RULES | Right to Information Act, 2005 | Section 27 | G.S.R. 603(E) | Personnel | PUBLISHED |
| **Consumer Protection (CDRC) Rules, 2020** | RULES | Consumer Protection Act, 2019 | Section 101 | G.S.R. 448(E) | Consumer Affairs | PUBLISHED |
| **Right of Children to Free & Compulsory Education Rules, 2010** | RULES | RTE Act, 2009 | Section 38 | G.S.R. 294(E) | Education | PUBLISHED |
| **Central Motor Vehicles Rules, 1989** | RULES | Motor Vehicles Act, 1988 | Sections 27, 64, 110 | G.S.R. 590(E) | MoRTH | PUBLISHED |

---

## 3. High-Precision Retrieval of Subordinate Provisions

When citizens ask practical questions about court forms, committee rules, or filing deadlines, the RAG engine queries subordinate rules:
- **Form A / Form B for unpaid wages:** Retrieved from *Payment of Wages (Procedure) Rules, 1937* Rule 3.
- **Domestic Incident Report (DIR):** Retrieved from *PWDVA Rules, 2006* Rule 4 (Form I).
- **E-Commerce 48-hour grievance acknowledgment:** Retrieved from *Consumer Protection (E-Commerce) Rules, 2020* Rule 4.
- **Front Office legal aid clinics:** Retrieved from *NALSA Regulations, 2010* Regulation 3.
