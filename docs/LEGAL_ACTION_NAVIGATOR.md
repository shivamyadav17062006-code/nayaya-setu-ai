# NyayaSaathi (न्यायसाथी) — Legal Action Navigator Architecture

## 1. Executive Summary

The **Legal Action Navigator** is NyayaSaathi's procedural complaint guidance and execution engine. While the Know Your Rights (KYR) Discovery Engine (Phase 12) identifies *what rights and protections a citizen has*, the Legal Action Navigator answers *what concrete legal and administrative actions the citizen must take next*.

All workflows are grounded in verified Indian statutory procedures, eliminating procedural ambiguity, fake online filing promises, and unauthorized third-party submissions.

---

## 2. Core Architectural Principles

```
Citizen Situation / Right Discovered
               │
               ▼
   [Procedure Directory Search]
               │
               ▼
[Workflow & Eligibility Pre-Screening]
               │
               ▼
   [Step-by-Step Action Tracker]
    ├── Document Checklist Validation
    ├── Statutory Timelines & Fee Tracking
    ├── Conditional Branching Decision Points
    └── Target Authority Identification
               │
               ▼
[Safe External Navigation Interstitial]
    └── Explicit Consent & Portal Redirection (.gov.in / .nic.in)
               │
               ▼
   [Progress Persistence Engine]
    ├── Authenticated User Sync (PostgreSQL RLS)
    └── Guest Session Sync (x-session-id Isolation)
```

### 2.1 Zero Automated Filing & Safety Interstitials
NyayaSaathi never files complaints or petitions on behalf of citizens. Automated or proxy filing without an advocate or citizen direct biometric authentication is prohibited under Indian procedural codes (CPC, CrPC/BNSS, Consumer Protection Rules). When a user clicks any external government portal (e.g., e-Daakhil, Shram Suvidha, Cybercrime portal, SHe-Box, RTI Online), the system displays a mandatory security interstitial modal confirming:
1. Target official government domain (`.gov.in` or `.nic.in`).
2. Transparent statement that NyayaSaathi does not hold credentials or submit forms.
3. Citizen will directly submit their complaint on the designated government server.

---

## 3. Data Flow & Engine Components

### 3.1 Backend Controller (`backend/src/controllers/workflowController.js`)
- `listWorkflows(req, res)`: Supports search queries (`?q=`), category filtering (`?category=`), and jurisdiction filters (`?jurisdiction=`).
- `getWorkflowByCategory(req, res)`: Retrieves complete workflow details and nested procedural steps by category slug (e.g. `labour`) or primary key UUID.
- `getWorkflowProgress(req, res)`: Fetches private progress scoped to `req.user.id` or `x-session-id`.
- `updateWorkflowProgress(req, res)`: Persists step completion, checked documents, branch choices, and notes.
- `resetWorkflowProgress(req, res)`: Clears user/session progress on demand.

### 3.2 Frontend Experience (`frontend/src/pages/Navigator.jsx`)
- **Category Filter Tabs & Real-time Search**: Responsive filter pills and instant search over titles, descriptions, and authorities.
- **Workflow Header Strip**: Displays Target Authority, Statutory Timelines, Prescribed Fees, and Verification Badge.
- **Collapsible Statutory Details**: Full list of statutory laws, eligibility criteria, and appellate hierarchy.
- **Interactive Stepper**: Vertical timeline displaying step numbers, instructions, tips, document checklists, and decision points.
- **Emergency Helplines Card**: Quick access to free statutory helplines (15100 NALSA, 112 Emergency, 1930 Cybercrime, 1915 NCH).

---

## 4. Privacy & Session Progress Isolation

Progress is strictly isolated:
- If logged in, progress is tied to `userId` via Supabase Row-Level Security.
- If anonymous/guest, a persistent cryptographic session token is generated on the client (`sess_<random>_<timestamp>`) and passed via the `x-session-id` HTTP header.
- Cross-session leakage is strictly prevented; queries without a matching user or session ID return `null`.
