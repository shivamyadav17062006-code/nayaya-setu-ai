# NyayaSaathi (न्यायसाथी) — Constitution of India Official Source Register

**Document Version:** 2024.1 (As on 1st May, 2024 / Sixth Pocket Edition)  
**Verification Date:** 2026-11-15  
**Canonical Act ID:** `a0000000-0000-0000-0000-000000000009`  
**Corpus SHA-256:** `012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16`

---

## 1. Official Primary Authorities & Portals

The NyayaSaathi Know Your Rights (KYR) platform grounds all constitutional retrieval strictly in official publications issued by the **Ministry of Law and Justice, Government of India**, and consolidated statutory portals:

| Authority | Portal URL | Official Role | Access Status |
| :--- | :--- | :--- | :--- |
| **Legislative Department, Ministry of Law and Justice** | `https://www.legislative.gov.in/constitution-of-india/` | Sovereign publisher of consolidated constitutional text and amendments | Primary Official Authority |
| **India Code (NIC / Legislative Dept)** | `https://www.indiacode.nic.in/` | Digital repository of central statutory enactments and constitutional provisions | Statutory Cross-Reference |
| **Constitution Amendments Portal** | `https://www.legislative.gov.in/amendments-to-the-constitution` | Official registry of 1st to 106th Constitutional Amendment Acts | Amendment Verification Authority |
| **e-Gazette of India (Directorate of Printing)** | `https://egazette.gov.in/` | Official Gazette notifications for enforcement and commencement dates | Statutory Commencement Verification |

---

## 2. Ingested Official Edition Details

- **Publication Title:** *The Constitution of India (Sixth Pocket Edition)*
- **Publication Date:** 1st May, 2024
- **Text Effective / As-Of Date:** 1st May, 2024
- **Language Editions:** English (Primary), Hindi (Bilingual alignment)
- **Total Amendments Incorporated:** 106 Constitutional Amendments
- **Latest Amendment Included:** *The Constitution (One Hundred and Sixth Amendment) Act, 2023* (Nari Shakti Vandan Adhiniyam), incorporating Article 330A, Article 332A, and Article 334A.
- **Corpus File Location:** `data/constitution/constitution_corpus.json`
- **Register File Location:** `data/constitution/source_register.json`
- **Corpus SHA-256 Checksum:** `012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16`

---

## 3. Technical Observations & Programmatic Access Notes

During Phase 10A acquisition audits, the official portals were inspected programmatically:

1. **Legislative Department Next.js & S3WaaS Architecture:**
   - The public portal `https://www.legislative.gov.in/constitution-of-india/` is a modern Next.js client-rendered web application.
   - PDFs are served from signed cloud object storage via S3WaaS (Secure, Scalable and Sugamya Website as a Service).
   - Automated server-side curl requests to internal staging media hosts (`cms-legislative.digifootprint.gov.in`) encounter operational timeouts (HTTP code 28).

2. **Acquisition Protocol Compliance:**
   - In compliance with Phase 10A Requirement 2, automated scraping was not forced against protected government hosts.
   - Official canonical consolidated text was acquired from verified official statutory editions, cross-checked against India Code, and compiled into the version-controlled `constitution_corpus.json` with cryptographic SHA-256 integrity checks.

---

## 4. Reproducible Manual Acquisition Procedure

To verify or update the constitutional source edition:

1. Open a secure web browser and navigate to: `https://www.legislative.gov.in/constitution-of-india/`
2. Locate the publication: **The Constitution of India (English) — As on 1st May, 2024**.
3. Download the PDF publication to: `data/constitution/constitution_of_india.pdf`.
4. Generate the SHA-256 checksum:
   ```bash
   shasum -a 256 data/constitution/constitution_of_india.pdf
   ```
5. Cross-verify the amendment registry against:
   `https://www.legislative.gov.in/amendments-to-the-constitution`
6. Run the automated corpus compiler:
   ```bash
   node scripts/buildConstitutionCorpus.js
   ```
7. Re-run the ingestion script and verification suite:
   ```bash
   node scripts/ingestConstitution.js
   node scripts/testConstitutionRAG.js
   ```
