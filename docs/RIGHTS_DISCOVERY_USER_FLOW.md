# NyayaSaathi — Personalized Know Your Rights User Flow & Interaction Design

## 1. The 9 Guided Screens / States

The Rights Discovery experience is designed as an accessible, mobile-first, step-by-step wizard (`/rights/discover`).

```
Landing / Intro (1) ──► Situation Intake (2) ──► Context Collection (3)
                                                        │
                                                        ▼
Results Dossier (6) ◄── Loading / Progress (5) ◄── Dynamic Follow-Ups (4)
```

---

### Screen 1: Introduction & Discovery Landing
- **Headline**: "Know Your Rights in Plain Language"
- **Sub-headline**: "Describe what happened in your own words. NyayaSaathi cross-references verified Indian statutory law and maps your remedies."
- **CTAs**: "Explore My Rights" (Primary) and "Resume Previous Search" (Secondary, visible if a session bookmark is stored in `localStorage`).
- **Privacy Assurance Badge**: Clear statement highlighting that no KYC, Aadhaar, or identity data is collected.

---

### Screen 2: Situation Intake
- **Form**: Free-form text area with character counter.
- **Guidance**: Plain-language placeholder indicating what details are helpful (who was involved, what occurred, monetary or physical impact).
- **Preset Scenario Chips**: Quick one-click scenarios:
  1. *Delayed Factory Salary*
  2. *Defective Mobile Phone Refund*
  3. *Arbitrary Tenant Eviction*
  4. *Domestic Abuse & Shelter Right*
  5. *Elderly Maintenance Denial*

---

### Screen 3: Context Collection
- **State / Union Territory**: Dropdown selector covering all 28 Indian States and 8 Union Territories.
- **Beneficiary Identity Cards**: Single-select cards with icons for:
  - *Worker / Employee*
  - *Woman*
  - *Consumer*
  - *Tenant*
  - *Senior Citizen (60+)*
  - *Person with Disability*
  - *Student / Parent*
  - *Farmer / Cultivator*
  - *SC / ST Community*
  - *General Citizen*
- **Privacy Consent Toggle**: Checkbox allowing users to save an anonymous bookmark token.

---

### Screen 4: Dynamic Follow-Up Questionnaire
- **Dynamic Questions**: 2 to 3 minimal questions generated based on the detected legal domain.
- **Contextual Transparency**: Every question provides a sub-text explaining *why* this fact matters under Indian law.
- **Single-Click Pill Selection**: Pre-computed options (e.g., `["Yes, within 12 months", "No, more than a year ago", "Not sure"]`).

---

### Screen 5: Analysis & Loading State
- **Progress Animation**: Step-by-step indicator showing:
  1. *Identifying legal issue & jurisdiction...*
  2. *Resolving beneficiary entitlements & Free Legal Aid eligibility...*
  3. *Querying 384-dimensional pgvector statutory database...*
  4. *Synthesizing actionable remedies & limitation periods...*

---

### Screen 6: Personalized Rights Results
- **Dossier Header**: Displays the citizen summary, confidence badge (`High Legal Match`, `Probable Legal Match`, `Preliminary Guidance`), and explanation notes.
- **Three Core Tabs**:
  - **Tab 1: Applicable Rights**: Cards detailing each statute, section number, why it applies, key conditions, and exceptions.
  - **Tab 2: Recommended Remedies**: Actionable procedural cards with designated authority, statutory time limits, and step-by-step filing instructions.
  - **Tab 3: Free Legal Aid & Helplines**: Beneficiary-specific benefits (e.g. Free Court Advocate under LSAA Sec. 12) and 24x7 government helplines.

---

### Screen 7: Relevant Law Details (Integrated in Tab 1)
- **Expandable Statute Card**: Allows toggling between plain-language simplified explanation and verbatim Gazette statutory text.
- **Official Traceability Link**: Direct permalink to the official India Code or Gazette repository.
- **Verification Stamp**: Verification date and statutory status (`PUBLISHED`).

---

### Screen 8: Recommended Remedies (Integrated in Tab 2)
- Shows remedy type (`AUTHORITY`, `TRIBUNAL`, `COURT`, `COMPLAINT`).
- Official portal buttons linking to e-Daakhil, Shram Suvidha, NALSA, or Elderline.
- Sequential action steps: Notice $\rightarrow$ Complaint Filing $\rightarrow$ Fee Exemption $\rightarrow$ Hearing.

---

### Screen 9: Legal Aid & Privacy Controls (Integrated in Tab 3)
- **Free Court Representation**: Automatic eligibility flag for women, children, workers, disabled, and SC/ST under Section 12 of the Legal Services Authorities Act, 1987.
- **Helplines Directory**: NALSA 15100, National Emergency 112, Women Helpline 181, Consumer Helpline 1915, Elderline 14567.
- **Privacy Erasure**: "Erase Data" button calling the deletion API to wipe stored session records.
- **Statutory Notice**: Mandatory legal awareness disclaimer directing citizens to local DLSAs for formal litigation representation.
