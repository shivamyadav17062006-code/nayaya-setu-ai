# NyayaSaathi — Legal Citation Validation System

## 1. Zero-Hallucination Policy & Principles

As a public legal awareness service for Indian citizens, inaccurate or fabricated legal citations can cause severe real-world harm. NyayaSaathi enforces an absolute **Zero-Hallucination** guarantee:

1. **Retrieved-Set Citation Constraint**: The AI model is strictly prohibited from citing any statute, section, or penalty clause that was not present in the verified retrieval set returned by the database.
2. **Official Repository Validation**: Every citation must possess a verifiable official URL pointing to a recognized government legal repository (`indiacode.nic.in`, `legislative.gov.in`, `nalsa.gov.in`, `shramsuvidha.gov.in`, `edaakhil.nic.in`).
3. **Database Verification**: All statutory acts and sections exist as canonical UUID records in Supabase PostgreSQL (`legal_acts` and `legal_sections`).
4. **Transparent Degradation**: If no statutory provision matches the citizen's inquiry, the system explicitly states that no specific section was found and directs the user to NALSA Helpline **15100** rather than guessing.

---

## 2. Validation Pipeline Architecture

```text
               LLM Generated Response + Retrieved Provisions
                                     │
                                     ▼
                citationValidator.validateCitations()
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
   [Act & Section Check]                                   [URL Validation]
Does Act and Section match a                          Does URL belong to trusted
retrieved database record?                            official government domain?
         │                                                       │
         ▼                                                       ▼
      (Pass)                                                  (Pass)
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
                      [Sanitize Response Text]
                Strip or correct ungrounded citations
                                     │
                                     ▼
                 Attach Grounded Statutory Metadata:
                 - Act Name & Year
                 - Section Number & Title
                 - Verbatim Original Statutory Text
                 - Plain-Language Summary
                 - Jurisdiction ("CENTRAL" | "STATE")
                 - Verification Status ("VERIFIED")
                 - Official Government Link
```

---

## 3. Trusted Government Domain Whitelist

The citation validator validates all external links against trusted official repositories:

```javascript
const TRUSTED_OFFICIAL_DOMAINS = [
  'indiacode.nic.in',        // Ministry of Law and Justice (Primary Indian Code)
  'legislative.gov.in',      // Legislative Department (Constitution & Central Acts)
  'nalsa.gov.in',            // National Legal Services Authority
  'shramsuvidha.gov.in',     // Ministry of Labour & Employment
  'edaakhil.nic.in',         // National Consumer Disputes Redressal Commission
  'consumerhelpline.gov.in', // Department of Consumer Affairs
  'main.sci.gov.in',         // Supreme Court of India
  'ecourts.gov.in',          // eCourts Services
];
```

---

## 4. UI Rendering of Verified Citations

Verified citations are rendered in the React interface (`Chat.jsx`) as interactive **Applicable Law Cards**:
- Verified Badge (`ShieldCheck` icon, `VERIFIED`).
- Jurisdiction Badge (`CENTRAL` / `STATE`).
- Collapsible verbatim statutory text with distinct parchment styling.
- Official India Code hyperlink.
