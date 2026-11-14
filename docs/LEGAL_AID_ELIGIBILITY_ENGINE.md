# NyayaSaathi (न्यायसाथी) — Legal Aid Eligibility Rules Engine

## 1. Executive Summary

The **Legal Aid Eligibility Rules Engine** implements an explainable, statutory evaluation model based on Section 12 of the **Legal Services Authorities Act, 1987 (Act No. 39 of 1987)** and applicable State Legal Services Authority Rules.

The engine explicitly rejects the invalid assumption of a single universal income ceiling across India. Instead, it distinguishes **automatic statutory exemptions** (Section 12(a)–(g)) from **income-based requirements** (Section 12(h)), evaluating state-specific rules and court jurisdictions.

---

## 2. Statutory Architecture (Section 12 of LSAA 1987)

```
                       Citizen Legal Aid Query
                                 │
                                 ▼
         [Step 1: Automatic Statutory Exemption Check]
         ├── Sec 12(a): Scheduled Caste (SC) or Scheduled Tribe (ST)
         ├── Sec 12(b): Victim of Trafficking in Human Beings / Begar
         ├── Sec 12(c): Woman or Child (under 18 years)
         ├── Sec 12(d): Person with a Disability (RPwD Act 2016)
         ├── Sec 12(e): Person under undeserved want (Disaster / Riot / Flood / Atrocity)
         ├── Sec 12(f): Industrial Workman (Industrial Disputes Act 1947)
         └── Sec 12(g): Person in Custody (Police, Jail, Juvenile, Psychiatric Home)
                                 │
                 ┌───────────────┴───────────────┐
                 │ YES                           │ NO
                 ▼                               ▼
     [POTENTIALLY_ELIGIBLE]         [Step 2: Section 12(h) Income Check]
     (No Income Ceiling Applies)    ├── Has annual income been provided?
                                    │    ├── NO  -> [MORE_INFORMATION_REQUIRED]
                                    │    └── YES -> Query state & court threshold
                                    ▼
                         [Compare Declared Income vs State Limit]
                                    ├── Income <= Limit -> [POTENTIALLY_ELIGIBLE]
                                    └── Income > Limit  -> [POTENTIALLY_NOT_ELIGIBLE]
```

---

## 3. Four-State Output Specification

The engine returns one of four definitive states:

1. **`POTENTIALLY_ELIGIBLE`**:
   - The citizen either satisfies an affirmative statutory category under Section 12(a)–(g) (income exempt) or their declared annual income is within the gazetted threshold for their State/UT and court level.
   - Provides concrete next steps, actionable legal aid schemes, and local DLSA front office details.

2. **`POTENTIALLY_NOT_ELIGIBLE`**:
   - The citizen's declared income exceeds the statutory ceiling for free court-appointed panel counsel.
   - Emphasizes that **walk-in legal advice clinics, mediation centers, and Lok Adalat dispute resolution remain 100% free of cost for all citizens**, regardless of income.

3. **`MORE_INFORMATION_REQUIRED`**:
   - The citizen does not fall under an automatic exemption and has not declared their annual income, or has omitted crucial jurisdictional facts.
   - Transparently displays the applicable state threshold to guide the citizen on what information is needed.

4. **`HUMAN_VERIFICATION_RECOMMENDED`**:
   - For complex, borderline, or non-binary legal circumstances (e.g., transgender rights under *NALSA v. UOI*, disputed workman definitions, or exceptional disaster grants).
   - Directs the citizen to the DLSA Member Secretary or the National Legal Helpline (**15100**).

---

## 4. Statutory Non-Approval Disclaimer

Under `AGENTS.md` Rule 7, every evaluation response includes the mandatory legal disclaimer:
> *"Statutory Notice: This is an automated preliminary evaluation based on Section 12 of the Legal Services Authorities Act, 1987. It does not constitute an official grant or sanction of legal aid. Official assignment of a panel advocate is subject to verification of self-declaration/affidavit by the Secretary of the respective District Legal Services Authority (DLSA) or High Court/Supreme Court Legal Services Committee."*
