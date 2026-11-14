# NyayaSaathi — Official Legal Data Sources Register

## 1. Statutory Discovery Hierarchy

In strict alignment with `AGENTS.md` (Rule 6: Zero Legal Hallucinations & Traceable Citations), NyayaSaathi sources all statutory and subordinate legal data exclusively from sovereign government databases, official gazettes, and recognized statutory authorities.

```
                  ┌─────────────────────────────────────┐
                  │      Tier 1: Sovereign Gazettes     │
                  │   e-Gazette of India (egazette.gov) │
                  │  Official State Government Gazettes │
                  └──────────────────┬──────────────────┘
                                     │
                  ┌──────────────────▼──────────────────┐
                  │    Tier 2: Consolidated Repositories│
                  │      India Code (indiacode.nic.in)  │
                  │   Legislative Dept (legislative.gov)│
                  └──────────────────┬──────────────────┘
                                     │
                  ┌──────────────────▼──────────────────┐
                  │ Tier 3: Specialized Ministries & LSA│
                  │   NALSA & State Legal Services      │
                  │   Ministry of Consumer Affairs / MoLE
                  └─────────────────────────────────────┘
```

---

## 2. Source Register & Permitted Acquisition Protocols

| Source Identifier | Organization | Official Base URL | Jurisdiction | Document Categories | Ingestion Method |
|:---|:---|:---|:---|:---|:---|
| `SRC_INDIA_CODE` | Ministry of Law and Justice | `https://www.indiacode.nic.in` | All India / Central | Central Acts, Repealed Acts, State Acts | HTML Ingestion & PDF permalink resolution |
| `SRC_E_GAZETTE` | Directorate of Printing, MoHUA | `https://egazette.gov.in` | Central Government | Extraordinary Notifications, Rules, Commencement Dates | Official Gazette PDF download & checksumming |
| `SRC_LEG_DEPT` | Legislative Department, MoL&J | `https://www.legislative.gov.in` | Central Government | Constitution of India (Consolidated Ed.), Amendments | Consolidated English & Hindi PDF parsing |
| `SRC_NALSA` | National Legal Services Authority | `https://nalsa.gov.in` | All India | Legal Services Authorities Act, Schemes, Lok Adalat Rules | Official PDF & Entitlement Guidelines |
| `SRC_MAHA_GAZ` | Government of Maharashtra | `https://egazette.mahaonline.gov.in` | Maharashtra | State Acts, Land Revenue Code, Shops & Est. Rules | State Gazette Scraper |
| `SRC_DELHI_LEG` | Delhi Legislative Assembly | `https://delhiassembly.delhi.gov.in` | NCT of Delhi | Delhi Rent Control Act, Right to Public Services | Government Portal Ingestion |
| `SRC_KAR_DPL` | Dept of Parliamentary Affairs, Karnataka | `https://dpal.karnataka.gov.in` | Karnataka | Karnataka Land Reforms, Gram Swaraj & Panchayat Raj | Official State Portal Ingestion |
| `SRC_SCI_REP` | Supreme Court of India | `https://main.sci.gov.in` / e-SCR | All India | Landmark Precedents, Constitutional Bench Rulings | e-SCR Judgment Permalinks |

---

## 3. Acquisition Rules & Data Integrity Standards

1. **Permitted Access Only**: The ingestion engine uses standard HTTP GET requests adhering to robots.txt guidelines. It strictly prohibits bypassing access controls, authentication walls, or CAPTCHA-gated endpoints.
2. **Mandatory Canonical URL**: Every statutory act, section, or subordinate rule must preserve its source URL pointing directly to an official government portal.
3. **SHA-256 Document Checksums**: When downloading raw legislative PDFs or Gazette gazettes, a cryptographic SHA-256 checksum is computed and saved in `public.legal_acts.checksum`.
4. **Enactment vs Commencement Disambiguation**: Enactment dates (date of Presidential / Governor assent) and effective commencement dates (notified in the Official Gazette) are recorded separately to ensure citizens are not advised under provisions not yet brought into force.
5. **No Synthetic Statutes**: Fabricating missing statutes, mock Act numbers, or fictitious legal sections to fill database gaps is strictly prohibited. If a statutory provision is unavailable, NyayaSaathi transparently reports the lack of verified data and directs citizens to NALSA Helpline **15100**.
