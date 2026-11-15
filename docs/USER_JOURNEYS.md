# NyayaSaathi (न्यायसाथी) Citizen User Journeys & Workflow Mapping

## 1. Journey 1: Legal Consultation & Conversational Inquiry

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Navbar
    participant ChatView as /chat
    participant SpeechEngine as Web Speech / Bhashini
    participant Backend as Node.js / Express
    participant VectorStore as PostgreSQL / pgvector

    Citizen->>Navbar: Click "AI Assistant" or tap sample prompt on Home
    Navbar->>ChatView: Navigate to /chat
    alt Voice Question
        Citizen->>ChatView: Tap Microphone icon (Speech Input)
        ChatView->>SpeechEngine: Language-aware Speech Recognition (hi-IN, mr-IN, en-IN)
        SpeechEngine-->>ChatView: Populate input with vernacular transcript
    else Typed Input
        Citizen->>ChatView: Type legal question in box
    end
    Citizen->>ChatView: Click Send
    ChatView->>Backend: POST /api/chat { question, language, sessionId }
    Backend->>VectorStore: match_legal_chunks (pgvector cosine similarity)
    VectorStore-->>Backend: Grounded statutory provisions
    Backend-->>ChatView: Return structured answer with citations & nextSteps
    ChatView-->>Citizen: Display grounded legal answer with Section badges (§)
    opt Audio Playback
        Citizen->>ChatView: Tap "Read Aloud" button
        ChatView->>SpeechEngine: Synthesize vernacular speech
    end
```

---

## 2. Journey 2: Guided Rights Discovery to Action Navigator

```mermaid
flowchart TD
    Start["Citizen on Landing Page"] --> Choice{"Entry Path"}
    Choice -- "Know Problem" --> Cat["Browse /rights"]
    Choice -- "Unsure of Law" --> Disc["Open /rights/discover"]

    Disc --> Step1["Step 1: Describe Situation in Plain Words"]
    Step1 --> Step2["Step 2: Select Beneficiary Category (Worker, Consumer, Woman)"]
    Step2 --> Step3["Step 3: Answer Minimal Clarifying Questions"]
    Step3 --> Match["AI Engine Matches Relevant Statutes & Remedies"]
    Match --> Display["Display Applicable Rights with (§) Section Citations"]

    Display --> ActionChoice{"Take Action?"}
    ActionChoice -- "File Grievance" --> Nav["Open Legal Action Navigator (/navigator)"]
    ActionChoice -- "Free Lawyer" --> Aid["Check NALSA Eligibility (/eligibility)"]
    ActionChoice -- "Draft Notice" --> Doc["Open Document Assistant (/documents)"]
```

---

## 3. Journey 3: Free Legal Aid Qualification & Provider Matching

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant EligView as /eligibility
    participant RulesEngine as Backend rulesEngine.js
    participant AidView as /aid-finder
    participant DB as PostgreSQL

    Citizen->>EligView: Open NALSA Eligibility Assistant
    Citizen->>EligView: Provide: State (e.g. Maharashtra), Category (e.g. Woman), Income
    EligView->>RulesEngine: POST /api/eligibility
    Note over RulesEngine: Check Section 12(c) Statutory Exemption
    RulesEngine-->>EligView: Return POTENTIALLY_ELIGIBLE (isStatutoryExempt: true)
    EligView-->>Citizen: Display Qualification badge & Statutory explanation
    Citizen->>EligView: Click "Find Nearest DLSA Office"
    EligView->>AidView: Redirect to /aid-finder?state=Maharashtra
    AidView->>DB: GET /api/aid?state=Maharashtra
    DB-->>AidView: Return official DLSA front office contacts & address
    AidView-->>Citizen: Display verified DLSA card with direct phone & portal link
```

---

## 4. Journey 4: Statutory Legal Notice Drafting & Delivery

```mermaid
flowchart LR
    DocPage["/documents"] --> SelectTmpl["Select Notice Template (Wage Demand, RTI, Consumer)"]
    SelectTmpl --> FillForm["Enter Worker/Employer particulars & dues"]
    FillForm --> LivePreview["Live Document Preview Updates in Real-Time"]
    LivePreview --> Actions{"Delivery Action"}
    Actions -- "Copy Text" --> Clip["Copy to Clipboard"]
    Actions -- "Print / PDF" --> Print["Print with Speed Post AD Instructions"]
```

---

## 5. Journey 5: Citizen Dashboard Monitoring

1. **Dashboard Boot (`/dashboard`)**:
   - Fetches active user profile from `/api/auth/me`.
   - Fetches past conversation sessions from `/api/chat/sessions`.
   - Fetches active grievance workflow progress from `/api/workflows/user/all-progress`.
   - Fetches saved legal aid assessments from `/api/eligibility/assessments`.
   - Reads bookmarked rights from device local storage (`nyayasaathi_saved_rights`).
2. **Outcome**:
   - Single unified citizen cockpit tracking all ongoing legal journeys with zero data leakage between citizen accounts.
