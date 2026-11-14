# Multi-Tier Jurisdiction-Aware RAG Retrieval

## 1. Retrieval Architecture

Citizens accessing NyayaSaathi frame legal queries from a specific locality (e.g., *"My employer in Mumbai is not paying overtime"* or *"How many days notice is required before firing an employee in Delhi?"*).

If a naive RAG retriever searches purely by keyword, it risks returning conflicting enactments from different States (e.g., advising a Mumbai employee under Delhi's 1954 Act or Karnataka's 1961 Act).

NyayaSaathi implements **Multi-Tier Jurisdiction-Aware RAG Retrieval** to guarantee cross-state isolation and high-relevance hybrid statutory retrieval.

```
                         Citizen User Query
                                  |
                                  v
                  State Intent Extraction Engine
                   detectJurisdictionState(query)
                                  |
               +------------------+------------------+
               | Target State                        | No State
               | Identified                          | Identified
               v                                     v
       Target: MAHARASHTRA                    Target: ALL
       (Filters: MH + CENTRAL)               (General Hybrid)
               |                                     |
               +------------------+------------------+
                                  |
                                  v
                 Supabase pgvector Vector Search
                    match_legal_chunks(query_emb)
                                  |
                                  v
              Cross-State Isolation & Conflict Resolution
           - Exclude other states' enactments (e.g. DL, KA)
           - Retain Central Acts (Payment of Wages, PWDVA)
           - Retain Target State Acts (Maharashtra Shops Act)
                                  |
                                  v
                   Hybrid Multi-Factor Scoring
         Score = (Vector × 0.50) + (Lexical × 0.35) 
                 + IntentBoost (+0.25) + StateBoost (+0.25) 
                 - ConstitutionalDiscount (-0.15)
                                  |
                                  v
               Verified State + Central Legal Context
                                  |
                                  v
                    Google Gemini 2.5 Generation
```

---

## 2. Key Components

### A. State Intent Extraction
`detectJurisdictionState(query)` analyzes geographic indicators and metropolitan keywords:
* **Maharashtra (`MH`)**: `maharashtra`, `mumbai`, `pune`, `nagpur`, `thane`, `nashik`.
* **Delhi (`DL`)**: `delhi`, `new delhi`, `ncr`, `dilli`.
* **Karnataka (`KA`)**: `karnataka`, `bengaluru`, `bangalore`, `mysuru`, `mysore`, `sakala`.
* **Tamil Nadu (`TN`)**: `tamil nadu`, `chennai`, `madras`.
* **Uttar Pradesh (`UP`)**: `uttar pradesh`, `noida`, `lucknow`, `kanpur`.
* **West Bengal (`WB`)**: `west bengal`, `kolkata`, `calcutta`.

### B. Cross-State Isolation
When a target state is detected (e.g., `MAHARASHTRA`):
```javascript
if (targetState) {
  filtered = filtered.filter(
    (r) => !r.state || r.state.toUpperCase() === targetState.toUpperCase()
  );
}
```
* **Allowed**: Central statutory chunks (where `r.state` is null, e.g. Payment of Wages Act 1936, Constitution of India).
* **Allowed**: State statutory chunks matching `MAHARASHTRA`.
* **Blocked**: State statutory chunks belonging to `DELHI`, `KARNATAKA`, or other states.

### C. State Relevance Boosting
When a chunk belongs to the user's target jurisdiction, it receives a **+0.25 State Boost**, ensuring local state provisions rank at the very top of the evidence pool:
```javascript
const stateMatch = targetState && item.state && item.state.toUpperCase() === targetState.toUpperCase();
const stateBoost = stateMatch ? 0.25 : 0.0;
```

---

## 3. Retrieval Scenarios & Verification Evidence

### Scenario 1: Mumbai Overtime Wages Query
* **User Query**: *"What are the working hours and overtime wages in Mumbai shops?"*
* **Target State Detected**: `MAHARASHTRA`
* **Retrieved Provisions**:
  1. *Maharashtra Shops and Establishments Act, 2017* (Section 13 — Overtime wages at 2x rate) `[Sim: 1.0171]`
  2. *Maharashtra Shops and Establishments Act, 2017* (Section 6 — 9 hrs/day, 48 hrs/week) `[Sim: 0.9118]`
  3. *Maharashtra Shops and Establishments Act, 2017* (Section 18 — Women night shift conditions) `[Sim: 0.8916]`
* **Cross-State Isolation**: Delhi and Karnataka Shops Acts are completely excluded.

### Scenario 2: Delhi Employee Termination Query
* **User Query**: *"Notice of dismissal and termination for employee in Delhi"*
* **Target State Detected**: `DELHI`
* **Retrieved Provisions**:
  1. *Delhi Shops and Establishments Act, 1954* (Section 30 — Notice of dismissal) `[Sim: 1.1062]`
  2. *Delhi Shops and Establishments Act, 1954* (Section 8 — Daily/weekly hours) `[Sim: 0.8570]`
  3. *Delhi State Legal Services Authority Regulations, 2018* (Regulation 7 — Free legal aid) `[Sim: 0.7753]`

### Scenario 3: Karnataka Sakala Citizen Services Delay Query
* **User Query**: *"Citizen service delay compensation under Sakala in Bengaluru"*
* **Target State Detected**: `KARNATAKA`
* **Retrieved Provisions**:
  1. *Karnataka Guarantee of Services to Citizens Act (Sakala), 2011* (Section 4 — Citizen entitlement) `[Sim: 0.8942]`
  2. *Karnataka Guarantee of Services to Citizens Act (Sakala), 2011* (Section 8 — Compensatory costs for delay) `[Sim: 0.8814]`

### Scenario 4: Hybrid Wage Recovery in Mumbai
* **User Query**: *"My employer delayed my salary in Mumbai, what can I do?"*
* **Target State Detected**: `MAHARASHTRA`
* **Retrieved Provisions**:
  * *Payment of Wages Act, 1936* (Central — Section 15 compensation claim)
  * *Maharashtra Shops and Establishments Act, 2017* (State — Section 13 & 15 wage & leave entitlements)
  * *Maharashtra State Legal Services Authority Rules, 1998* (Rule 14 — DLSA Free Legal Aid)
