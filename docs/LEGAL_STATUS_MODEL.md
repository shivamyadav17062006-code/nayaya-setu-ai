# NyayaSaathi (न्यायसाथी) — Legal Status & Temporal Lifecycle Model
**Version**: 1.0.0  
**Specification**: 14-State Canonical Lifecycle & Temporal Validity Engine  
**Date**: November 15, 2026  

---

## 1. Architectural Philosophy

In legal informatics, representing a statute or section using a binary `is_active: boolean` is fundamentally flawed. Indian jurisprudence distinguishes between:
1. **Enactment** (Parliament passes the Bill and the President grants assent).
2. **Commencement** (The Executive notifies the appointed date in the Official Gazette under Section 1(3) or equivalent commencement clause).
3. **Staged / Partial Commencement** (Certain sections come into force on Date A, while others remain unnotified until Date B).
4. **Repeal with Savings** (A predecessor act is repealed, but transactions, pending inquiries, vested rights, and past offenses remain governed by the predecessor law under Section 6 of the General Clauses Act, 1897).
5. **Judicial Stays** (A provision remains on the statute book, but its enforcement is temporarily stayed by the Supreme Court or a High Court).

NyayaSaathi implements a version-aware 14-state legal status model to guarantee that citizens are advised on the exact legal force of any provision.

---

## 2. The 14-State Canonical Lifecycle

```
  [ DRAFT ] 
      │ (Introduced / Public consultation)
      ▼
  [ ENACTED ] 
      │ (Presidential Assent published in Gazette)
      ├───────────────────────────────┬──────────────────────────────┐
      ▼                               ▼                              ▼
[ NOT_YET_COMMENCED ]      [ PARTIALLY_IN_FORCE ]              [ IN_FORCE ]
      │                               │                              │
      │ (Commencement Notification)   │                              │ (Parliament passes Amendment)
      └───────────────────────────────┴───────────────►              ▼
                                                                [ AMENDED ]
                                                                     │
                                 ┌───────────────────────────────────┼──────────────────────────────────┐
                                 ▼                                   ▼                                  ▼
                        [ PARTIALLY_REPEALED ]                 [ REPEALED ]                       [ SUPERSEDED ]
                                 │                                   │                                  │
                                 └───────────────────────────────────┴──────────────────────────────────┘
                                                                     │
                                                                     ▼
                                                             [ HISTORICAL ]
```

### Detailed State Definitions

| State Code | Name | Legal Significance | Example in Indian Law | Retrieval Directive |
|---|---|---|---|---|
| `DRAFT` | Draft / Bill | Proposed legislation in public consultation or introduced in Legislature; not law. | Draft Maharashtra Wage Rules | Prohibited from being cited as operational law; label clearly as `DRAFT_PROPOSAL`. |
| `ENACTED` | Enacted | Passed by Parliament and received Presidential assent, but commencement notification not yet issued. | Occupational Safety, Health Code 2020 | State that Act has been passed by Parliament but awaits Gazette notification. |
| `NOTIFIED` | Notified | Subordinate legislation (Rules, Regulations, Orders) published in the Official Gazette. | Notification S.O. 2351(E) | Operational as subordinate administrative law. |
| `PARTIALLY_IN_FORCE` | Partially Commenced | Only specific sections have been brought into force by official notification; remainder staged. | Code on Wages, 2019 (Sec 42 in force; Sec 15-18 staged) | Check section-level status. If queried section is uncommenced, cite operative predecessor law. |
| `IN_FORCE` | In Force / Operative | Fully commenced, operational law governing present-day legal rights and obligations. | Consumer Protection Act, 2019; BNS 2023; BNSS 2023 | Primary basis for all current legal advice and dispute filings. |
| `NOT_YET_COMMENCED` | Not Yet Commenced | An enacted Act or section whose appointed date has not arrived. | Industrial Relations Code, 2020 | Provide notice of enactment, but direct citizen to active operative statute (IDA 1947). |
| `AMENDED` | Amended | Provision modified by a subsequent Amendment Act. | Constitution of India (as amended by 106th CAA) | Retrieve the consolidated amended text with a link to the amending Act. |
| `PARTIALLY_REPEALED` | Partially Repealed | Select sections repealed while remainder of statute continues in force. | Specific Relief Act (sections replaced by 2018 amendment) | Clearly identify operative verses repealed sections. |
| `REPEALED` | Repealed | Formally abrogated by a repealing statute or sunset clause. | Consumer Protection Act, 1986 (repealed 2020) | Never cite for present disputes; cite only for historical disputes or past causes of action. |
| `SUPERSEDED` | Superseded | Overridden or replaced by subordinate legislation, revised rules, or subsequent notification. | Pre-2020 E-Commerce consumer guidelines | Do not cite; cite the overriding 2020 Rules. |
| `STAYED` | Judicially Stayed | Enforcement temporarily suspended by an order of the Supreme Court or High Court. | Any provision under interlocutory injunction | Inform user that enforcement is currently stayed by judicial order. |
| `HISTORICAL` | Historical | Preserved exclusively for temporal queries (e.g. rights in 2022). | IPC 1860 for offenses committed before 01-07-2024 | Retrieve only when `event_date < effective_end_date`. |
| `UNDER_REVIEW` | Under Review | Flagged by legal moderator or community for status verification. | Newly notified state rules awaiting editorial review | Display with `REQUIRES_HUMAN_REVIEW` banner. |
| `UNVERIFIED` | Unverified | Ingested draft or snapshot not yet traced to an authoritative Gazette entry. | Web-scraped notification pending gazette match | Never present as authoritative government guidance. |

---

## 3. Temporal Validity Fields & Schema Contract

Every legal entity (`legal_acts`, `legal_sections`, `legal_rules`) in PostgreSQL must support the following temporal validity schema:

```sql
-- Core Temporal Validity Columns
status                 VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
enactment_date         DATE,
assent_date            DATE,
gazette_number         VARCHAR(128),
gazette_date           DATE,
commencement_date      DATE,
effective_from         TIMESTAMPTZ(6),
effective_to           TIMESTAMPTZ(6),
repeal_date            DATE,
repealed_by_act_id     UUID,
savings_clause_ref     TEXT,
is_partially_commenced BOOLEAN DEFAULT false,
commenced_sections     TEXT[],
staged_sections        TEXT[],
last_verified_at       TIMESTAMPTZ(6) DEFAULT NOW()
```

---

## 4. Query Evaluation Rule: Current vs Historical Disputes

When evaluating a legal query:
1. **Determine Dispute Event Date ($T_{event}$)**:
   - If user explicitly mentions a date or year (e.g., *"My landlord withheld deposit in 2022"*), set $T_{event} = \text{2022-01-01}$.
   - If no date is mentioned, assume current date ($T_{event} = \text{NOW()}$).
2. **Apply Temporal Filter**:
   $$\text{valid} \iff (effective\_from \le T_{event}) \land (effective\_to \text{ IS NULL } \lor effective\_to > T_{event})$$
3. **Savings Provision Enforcement**:
   - If an offense occurred prior to **July 1, 2024**, evaluate under IPC 1860 / CrPC 1973 (governed by savings clauses in BNS Sec. 358 and BNSS Sec. 531).
   - If an offense occurred on or after **July 1, 2024**, evaluate strictly under BNS 2023 / BNSS 2023.
   - For wage and labour claims, since Code on Wages operational sections have not been commenced nationwide, evaluate under Payment of Wages Act 1936 / Minimum Wages Act 1948 while highlighting the enacted modern Code.
