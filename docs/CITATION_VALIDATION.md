# NyayaSaathi (न्यायसाथी) — Citation Validation & Hallucination Prevention
**Version**: 1.0.0  
**Enforcement**: Dual-Layer Citation Integrity Layer  
**Date**: November 15, 2026  

---

## 1. Zero Legal Hallucination Mandate

Under [AGENTS.md](file:///Users/vedanshsaini/Documents/Major_Project/nayaya-setu-ai/AGENTS.md), NyayaSaathi strictly prohibits the fabrication of Article numbers, Section numbers, Act titles, penalties, or procedures.

A legal answer must NEVER cite a non-existent section to sound authoritative. If statutory data is missing or not applicable, the system must transparently declare that no specific section was retrieved and direct the citizen to NALSA Helpline **15100** or their local District Legal Services Authority.

---

## 2. Validation Architecture

```
[Gemini LLM Generated Text]
           │
           ▼
[CitationValidator: validateCitations()]
  ├── 1. Existence Check: Was the citation in the retrieved legal provisions?
  ├── 2. Domain Check: Does the source URL belong to a trusted government domain?
  │       (indiacode.nic.in, legislative.gov.in, egazette.gov.in, mha.gov.in, labour.gov.in, nalsa.gov.in)
  ├── 3. Status Check: Is the statute IN_FORCE, PARTIALLY_IN_FORCE, or SAVED?
  └── 4. Deduplication: One card per distinct section
           │
           ▼
[Sanitization: sanitizeResponseText()]
  ├── Discards fabricated sections not in the validated set
  └── Strips unverified penalty claims
           │
           ▼
[Verified Answer & Citation Cards Delivered to Citizen]
```

---

## 3. Trusted Government Domain Whitelist

- `indiacode.nic.in` — Central & State Acts Repository
- `legislative.gov.in` — Constitution of India & Amending Acts
- `egazette.gov.in` — Official Gazette of India (Commencement & Repeal Notifications)
- `mha.gov.in` — Ministry of Home Affairs (BNS, BNSS, BSA)
- `labour.gov.in` — Ministry of Labour & Employment (Wage & Industrial Rules)
- `wcd.nic.in` — Ministry of Women & Child Development (PWDVA, POSH)
- `consumeraffairs.nic.in` & `consumerhelpline.gov.in` — Consumer Affairs
- `dopt.gov.in` & `rtionline.gov.in` — Right to Information
- `nalsa.gov.in` — National Legal Services Authority
- `sci.gov.in` & `ecourts.gov.in` — Supreme Court & High Court Judgments
