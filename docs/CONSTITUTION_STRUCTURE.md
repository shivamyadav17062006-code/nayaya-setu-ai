# NyayaSaathi (न्यायसाथी) — Constitution of India Structural Taxonomy

This document outlines the hierarchical structure, clause decomposition rules, and schedule classification of the Constitution of India as ingested into NyayaSaathi's Know Your Rights (KYR) RAG pipeline.

---

## 1. Constitutional Taxonomy & Top-Level Hierarchy

The Indian Constitution is modeled within NyayaSaathi as a 4-tier knowledge hierarchy:
1. **Document Level:** The Constitution of India (1950, amended up to 106th CAA 2023).
2. **Part / Schedule Level:** 26 Parts (Parts I to XXII, including IVA, IXA, IXB, XIVA) + 12 Schedules.
3. **Article / Provision Level:** 395 Articles (with lettered insertions such as 21A, 39A, 51A, 300A, 330A).
4. **Clause / Subclause Level:** Discrete enforceable clauses (e.g. Article 19(1)(a), Article 15(3), Article 32(2)).

---

## 2. Catalog of Constitutional Parts

| Part | Title | Article Range | Core Focus |
| :--- | :--- | :--- | :--- |
| **Preamble** | Preamble to the Constitution | — | Guiding philosophy, sovereignty, secularism, justice, liberty, equality, fraternity |
| **Part I** | The Union and its Territory | 1–4 | Territory, admission and reorganization of States |
| **Part II** | Citizenship | 5–11 | Citizenship criteria, Parliamentary regulation |
| **Part III** | Fundamental Rights | 12–35 | Enforceable fundamental freedoms, equality, life, constitutional remedies |
| **Part IV** | Directive Principles of State Policy | 36–51 | Non-justiciable socio-economic state duties (free legal aid, uniform civil code) |
| **Part IVA** | Fundamental Duties | 51A | 11 civic duties of citizens (inserted by 42nd CAA, 86th CAA) |
| **Part V** | The Union | 52–151 | President, Union Council of Ministers, Parliament, Supreme Court jurisdiction |
| **Part VI** | The States | 152–237 | Governor, State Legislature, High Courts, Subordinate Judiciary |
| **Part VII** | The States in Part B of the First Schedule | 238 | (Repealed by 7th CAA, 1956) |
| **Part VIII**| The Union Territories | 239–242 | Administration of Union Territories |
| **Part IX** | The Panchayats | 243–243O | Local self-governance in rural areas (73rd CAA, 1992) |
| **Part IXA**| The Municipalities | 243P–243ZG | Urban local bodies (74th CAA, 1992) |
| **Part IXB**| The Co-operative Societies | 243ZH–243ZT | Regulation and autonomy of co-operative societies (97th CAA, 2011) |
| **Part X**  | The Scheduled and Tribal Areas | 244–244A | Administration of 5th and 6th Schedule areas |
| **Part XI** | Relations between the Union and the States | 245–263 | Legislative and administrative distribution of powers |
| **Part XII**| Finance, Property, Contracts and Suits | 264–300A | Financial distribution, GST, right to property (Article 300A) |
| **Part XIII**| Trade, Commerce and Intercourse within the Territory of India | 301–307 | Free movement of goods and commerce across States |
| **Part XIV**| Services under the Union and the States | 308–323 | Public service commissions, civil services tenure |
| **Part XIVA**| Tribunals | 323A–323B | Administrative and specialized judicial tribunals (42nd CAA, 1976) |
| **Part XV** | Elections | 324–329A | Election Commission of India, adult suffrage (Article 326) |
| **Part XVI**| Special Provisions Relating to Certain Classes | 330–342A | Reservations in legislative bodies (including 106th CAA Article 330A) |
| **Part XVII**| Official Language | 343–351 | Languages of the Union, High Courts, and Hindi promotion |
| **Part XVIII**| Emergency Provisions | 352–360 | National, State (President's rule), and Financial Emergency |
| **Part XIX**| Miscellaneous | 361–367 | Immunities of President/Governors, interpretation clauses |
| **Part XX** | Amendment of the Constitution | 368 | Special majority and ratification procedure for amending Constitution |
| **Part XXI**| Temporary, Transitional and Special Provisions | 369–392 | Special autonomy/provisions for specific States |
| **Part XXII**| Short Title, Commencement, Authoritative Text in Hindi and Repeals | 393–395 | Citation and repeal of predecessor statutes |

---

## 3. Clause-Level Decomposition Rules

To enable high-precision retrieval and prevent hallucinations, multi-part constitutional articles are decomposed at the clause level:

### 3.1 Article 19: Protection of Certain Freedoms
- **Clause (1)(a):** Freedom of speech and expression (includes press, information).
- **Clause (1)(b):** Right to assemble peaceably and without arms.
- **Clause (1)(c):** Right to form associations or unions or co-operatives.
- **Clause (1)(d):** Right to move freely throughout the territory of India.
- **Clause (1)(e):** Right to reside and settle in any part of India.
- **Clause (1)(g):** Right to practice any profession, trade, or business.
- **Clauses (2) to (6):** Enumerated reasonable statutory restrictions (public order, security of State, decency, defamation, contempt).

### 3.2 Article 15: Prohibition of Discrimination
- **Clause (1):** Prohibition against State discrimination on grounds of religion, race, caste, sex, or place of birth.
- **Clause (2):** Citizen access to public shops, restaurants, wells, tanks.
- **Clause (3):** Special protective provisions for women and children.
- **Clause (4):** Advancement of socially and educationally backward classes (SEBCs) and SC/STs.
- **Clause (5):** Admission reservations in educational institutions.
- **Clause (6):** 10% Economically Weaker Sections (EWS) reservation (103rd CAA, 2019).

### 3.3 Article 32 & Article 226: Prerogative Writs
- **Habeas Corpus:** Release of individuals unlawfully detained.
- **Mandamus:** Directing a public official or authority to perform a mandatory duty.
- **Prohibition:** Restraining inferior tribunals from exceeding jurisdiction.
- **Quo Warranto:** Challenging usurpation of a substantive public office.
- **Certiorari:** Quashing an illegal or jurisdictionally defective order.

---

## 4. The 12 Constitutional Schedules

1. **First Schedule:** Names of the States and Union Territories and their territorial extents.
2. **Second Schedule:** Salaries, allowances, and emoluments of the President, Governors, Judges, and CAG.
3. **Third Schedule:** Forms of Oaths or Affirmations for constitutional office holders.
4. **Fourth Schedule:** Allocation of seats in the Council of States (Rajya Sabha).
5. **Fifth Schedule:** Administration and control of Scheduled Areas and Scheduled Tribes.
6. **Sixth Schedule:** Administration of Tribal Areas in Assam, Meghalaya, Tripura, and Mizoram.
7. **Seventh Schedule:** Division of legislative powers into List I (Union List — 100 items), List II (State List — 61 items), and List III (Concurrent List — 52 items).
8. **Eighth Schedule:** 22 officially recognized languages of the Republic of India.
9. **Ninth Schedule:** Validation of certain Acts and Regulations (protected from judicial review under Article 31B, subject to basic structure doctrine).
10. **Tenth Schedule:** Anti-defection provisions for Members of Parliament and State Legislatures (52nd CAA, 1985).
11. **Eleventh Schedule:** 29 functional matters entrusted to Panchayats under Article 243G.
12. **Twelfth Schedule:** 18 urban governance matters entrusted to Municipalities under Article 243W.
