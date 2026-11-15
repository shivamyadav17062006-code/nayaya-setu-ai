# NyayaSaathi (न्यायसाथी) — Authoritative Legal Source Register
**Version**: 1.0.0  
**Date**: November 15, 2026  
**Auditor**: Principal Legal Technology Architect & Government Data Engineer  
**Mandate**: Single Source of Truth for Indian Law & Legal Awareness  

---

## 1. Principles of Legal Sourcing

In the NyayaSaathi architecture:
1. **Zero Unverified Assertions**: An AI model’s internal weights or text generation fluency must NEVER be accepted as legal authority.
2. **Authoritative Government Repositories**: Every legal act, article, section, amendment, notification, and rule must resolve to a recognized official government source.
3. **Traceability & Provenance**: Each ingested legal instrument must store:
   - Official Source URL
   - Publishing Department / Ministry
   - Gazette Notification Number
   - Publication Date
   - Content Checksum (SHA-256)
   - Last Checked / Verification Date
   - Reviewer / Ingestion Pipeline ID

---

## 2. Central Government Sources

### A. The Constitution of India
- **Primary Repository**: Ministry of Law and Justice, Legislative Department
- **Official URL**: `https://www.legislative.gov.in/documents/` and `https://legislative.gov.in/constitution-of-india`
- **Scope**:
  - Preamble
  - Parts I through XXII (Articles 1 to 395)
  - Schedules 1 through 12
  - Constitutional Amendment Acts (1st through 106th CAA)
- **Ingestion Policy**: Download consolidated official text only after Presidential assent and Gazette notification of amending Acts.

### B. Central Legislation (India Code)
- **Primary Repository**: Digital Repository of all Central and State Acts (Ministry of Law and Justice / NIC)
- **Official URL**: `https://www.indiacode.nic.in/`
- **Scope**:
  - All enactments of Parliament (Acts, Ordinances, Regulations).
  - Pre-independence statutes still in force (e.g., Transfer of Property Act 1882, Payment of Wages Act 1936).
  - Repealing Acts and Amendment Acts.
  - Linked Subordinate Legislation (Central Rules, Regulations, Orders).

### C. The Official Gazette of India (e-Gazette)
- **Primary Repository**: Directorate of Printing, Ministry of Housing and Urban Affairs
- **Official URL**: `https://egazette.gov.in/`
- **Verification Role**:
  - Definitive proof of **Commencement Dates** under Section 1(3) notifications.
  - Verification of **Repeal Notifications**.
  - Final publication of Central Rules and Statutory Orders (S.O. / G.S.R.).
  - Extraordinary Gazette notifications for emergency ordinances and authority appointments.

---

## 3. Ministry & Statutory Authority Portals

| Statutory Subject | Responsible Ministry / Authority | Official Portal | Ingestion & Verification Focus |
|---|---|---|---|
| **Labour & Wages** | Ministry of Labour & Employment (MoLE) | `https://labour.gov.in` | • Implementation status of the 4 Labour Codes<br>• Central Advisory Board notifications<br>• Minimum wage circulars & VDA rates<br>• Shram Suvidha portal rules |
| **Criminal Law Reform** | Ministry of Home Affairs (MHA) | `https://www.mha.gov.in` | • Bharatiya Nyaya Sanhita, 2023 (BNS)<br>• Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)<br>• Bharatiya Sakshya Adhiniyam, 2023 (BSA)<br>• Commencement Notifications (S.O. 848(E), 849(E), 850(E)) |
| **Women & Child Welfare** | Ministry of Women & Child Development (MWCD) | `https://wcd.nic.in` | • Protection of Women from Domestic Violence Act & Rules<br>• POSH Act 2013 & Rules<br>• Sakhi One Stop Centre directory<br>• Childline 1098 directives |
| **Consumer Affairs** | Department of Consumer Affairs | `https://consumeraffairs.nic.in` | • Consumer Protection Act, 2019<br>• Consumer Protection (E-Commerce) Rules, 2020<br>• National Consumer Helpline (1915 / consumerhelpline.gov.in)<br>• e-Daakhil electronic petition system |
| **Right to Information** | Department of Personnel and Training (DoPT) | `https://dopt.gov.in` & `https://rtionline.gov.in` | • RTI Act 2005 & 2012 Rules<br>• Central Information Commission (CIC) orders<br>• Fee schedules & exemption notifications |
| **Social Justice & Disability** | Ministry of Social Justice & Empowerment (MoSJE) | `https://socialjustice.gov.in` | • Rights of Persons with Disabilities Act, 2016<br>• Senior Citizens Maintenance Act, 2007<br>• National SC/ST welfare schemes |
| **Tribal Affairs** | Ministry of Tribal Affairs | `https://tribal.nic.in` | • Forest Rights Act, 2006 (FRA)<br>• PESA Act, 1996 provisions |
| **Education** | Department of School Education & Literacy | `https://dsel.education.gov.in` | • Right of Children to Free & Compulsory Education Act, 2009<br>• Section 12(1)(c) disadvantaged quota notifications |

---

## 4. Legal Aid Sourcing (NALSA & State Authorities)

- **Apex National Body**: National Legal Services Authority (NALSA)
  - **Official Portal**: `https://nalsa.gov.in/`
  - **Statutory Authority**: Legal Services Authorities Act, 1987 (Section 3 & 4)
  - **National 24x7 Legal Helpline**: **15100**
  - **Core Regulations**: *NALSA (Free and Competent Legal Services) Regulations, 2010*
- **State Legal Services Authorities (SLSAs)**:
  - 36 SLSA portals monitored across 28 States and 8 Union Territories.
  - Quarterly audit of **Section 12(h) Annual Income Ceilings**.
  - Registry of High Court Legal Services Committees and District Legal Services Authorities (DLSAs).

---

## 5. State Legislation & e-Gazette Repositories

| State / UT | Official Legislative Portal | State e-Gazette Portal | Key Monitored Domains |
|---|---|---|---|
| **Maharashtra** | `https://legislation.maharashtra.gov.in` | `https://egazette.maharashtra.gov.in` | Shops & Establishments 2017, Rent Control 1999, Draft Maharashtra Wage Rules, SLSA Income Limit (₹3L) |
| **Delhi (NCT)** | `https://delhi.gov.in` | `https://delhigovt.nic.in/gazette` | Delhi Shops 1954, Time Bound Delivery of Services 2011, DSLSA Regulations 2018 (₹3L) |
| **Karnataka** | `https://dpar.karnataka.gov.in` | `https://gazette.kar.nic.in` | Karnataka Shops 1961, Sakala Citizen Services 2011, KSLSA Rules (₹3L) |
| **Tamil Nadu** | `https://www.tn.gov.in/legislation` | `https://stationeryprinting.tn.gov.in` | Tamil Nadu Shops 1947, TNSLSA Rules (₹3L) |
| **Uttar Pradesh** | `https://uplegis.gov.in` | `https://upgazette.gov.in` | UP Dookan Aur Vanijya Adhishthan 1962, UPSLSA Rules (₹3L) |
| **West Bengal** | `https://wbxpress.com` | `https://kolkatagazette.gov.in` | WB Shops & Establishments 1963, WBSLSA Rules (₹3L) |
| **Gujarat** | `https://gujaratindia.gov.in` | `https://gazette.gujarat.gov.in` | Gujarat Shops 2019, GSLSA Rules (₹3L) |
| **Rajasthan** | `https://rajasthan.gov.in` | `https://rajasthangazette.gov.in` | Rajasthan Guaranteed Delivery of Public Services 2011, RSLSA (₹3L) |
| **All Other States (20)** | [India Code State Repository](https://www.indiacode.nic.in) | Respective State NIC Gazette nodes | State Shops, Tenancy, SLSA Rules |

---

## 6. Judicial Sources

- **Supreme Court of India**: `https://www.sci.gov.in` and official e-Courts / e-SCR portal (`https://escr.sci.gov.in`)
- **High Courts of India**: Official High Court portals via National Judicial Data Grid (`https://njdg.ecourts.gov.in`)
- **Usage Standard**: Supreme Court judgments cited only where a specific statutory provision has been authoritatively interpreted (e.g., *State of Punjab v. Jagjit Singh* on equal pay for equal work; *Arnesh Kumar v. State of Bihar* on arrest guidelines).
