# NyayaSaathi (न्यायसाथी) — Service Contracts & API Boundaries

**Document:** `docs/SERVICE_CONTRACTS.md`  
**Standard:** RESTful JSON over HTTP, Strict Security Boundaries, Zero Secret Exposure

---

## 1. System Communication Topology

```text
                  ┌───────────────────────────────┐
                  │       Browser / Client        │
                  │   (React SPA on Port 3000)    │
                  └───────────────┬───────────────┘
                                  │
                                  │ HTTPS / JSON (/api/*)
                                  │ JWT Bearer / Anonymous Session
                                  ▼
                  ┌───────────────────────────────┐
                  │    Express Backend Gateway    │
                  │          (Port 8000)          │
                  │   • Authentication & RBAC     │
                  │   • Prisma ORM Relational DB  │
                  │   • Session & Chat History    │
                  └───┬───────────────────────┬───┘
                      │                       │
      PostgreSQL /    │                       │ HTTP / JSON
      Session Pooler  │                       │ (Internal Network)
                      ▼                       ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐
    │  Supabase PostgreSQL    │   │   Node.js AI Service    │
    │  (Relational + pgvector)│   │       (Port 8001)       │
    │  • Users & Messages     │   │  • Gemini Generation    │
    │  • Statutory Knowledge  │   │  • Vector Embeddings    │
    │  • RLS Policies         │   │  • Intent Routing       │
    └─────────────────────────┘   └───────────┬─────────────┘
                                              │
                                              │ HTTPS (Official SDK)
                                              ▼
                                  ┌─────────────────────────┐
                                  │    Google Gemini API    │
                                  │    (gemini-2.5-flash)   │
                                  └─────────────────────────┘
```

---

## 2. Security Boundaries & Architectural Invariants

### 2.1 Backend Isolation:
- The **Backend Gateway (:8000)** is the sole authority for:
  - User authentication (hashing passwords, issuing/verifying JWTs).
  - Database persistence (`users`, `conversations`, `messages`).
  - Access control and rate limiting.
- The backend owns the `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 2.2 AI Service Isolation:
- The **AI Service (:8001)** is a stateless worker microservice:
  - It **never connects directly to the private user database** or handles user passwords.
  - It receives citizen query text and language preferences; it returns generated legal summaries, citations, and procedural steps.
  - It requires only `GEMINI_API_KEY` (for LLM generation) and public statutory retrieval access (`SUPABASE_URL` and `SUPABASE_ANON_KEY` for read-only `match_legal_chunks` RPC calls).
  - Database credentials (`DATABASE_URL`, passwords, JWT secrets) are **strictly prohibited** in the AI Service environment.

### 2.3 Frontend Protection:
- The **Frontend** never accesses private backend databases or API keys.
- All requests are routed through `/api` proxies. The frontend bundle never contains `GEMINI_API_KEY`, database passwords, or service role keys.

---

## 3. Frontend $\leftrightarrow$ Backend REST API Contract (Port 8000)

### 3.1 Chat Query Endpoint
- **Method & Path:** `POST /api/chat`
- **Authentication:** Optional (Supports authenticated users via `Authorization: Bearer <token>` or anonymous citizens via persistent `sessionId`).
- **Request Body (JSON):**
  ```json
  {
    "message": "My employer has not paid my salary for 3 months. What are my legal options?",
    "language": "en",
    "sessionId": "a0000000-0000-0000-0000-000000000001"
  }
  ```
- **Validation Rules (Zod):**
  - `message`: Required string, $1 \le \text{length} \le 2000$.
  - `language`: Optional ISO 639-1 code (`en`, `hi`, `mr`, `ta`, `te`, `bn`), default `en`.
  - `sessionId`: Optional UUID/string; if omitted, backend generates a new session UUID.

- **Successful Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "answer": "Under Section 5 of the Payment of Wages Act, 1936, employers must disburse earned wages on or before the 7th or 10th of the following month...",
      "sessionId": "a0000000-0000-0000-0000-000000000001",
      "language": "en",
      "sources": [
        {
          "act": "Payment of Wages Act, 1936",
          "section": "Section 5",
          "year": 1936,
          "title": "Time of payment of wages",
          "relevance": "Mandates monthly wage payment deadlines.",
          "sourceUrl": "https://www.indiacode.nic.in/handle/123456789/2367"
        },
        {
          "act": "Payment of Wages Act, 1936",
          "section": "Section 15",
          "year": 1936,
          "title": "Claims arising out of deductions from wages or delay in payment",
          "relevance": "Authorizes claims before Labour Commissioner with up to 10x penalty.",
          "sourceUrl": "https://www.indiacode.nic.in/handle/123456789/2367"
        }
      ],
      "suggestedActions": [
        {
          "label": "Gather appointment letter, bank statements, and salary records",
          "type": "RIGHTS",
          "payload": { "step": "evidence" }
        },
        {
          "label": "Lodge an online grievance on the Shram Suvidha portal",
          "type": "WORKFLOW",
          "payload": { "workflowId": "labour-wages-claim" }
        },
        {
          "label": "Contact NALSA National Legal Helpline 15100 for free court lawyer",
          "type": "AID",
          "payload": { "helpline": "15100" }
        }
      ],
      "engine": "ai-engine-rag",
      "degraded": false
    }
  }
  ```

- **Degraded Fallback Response (`200 OK` with Warning):**
  When AI services are offline, verified statutory notices are served:
  ```json
  {
    "success": true,
    "data": {
      "answer": "Under Section 5 of the Payment of Wages Act, 1936...",
      "sessionId": "a0000000-0000-0000-0000-000000000001",
      "language": "en",
      "sources": [...],
      "engine": "offline-statutory-notice",
      "degraded": true,
      "warning": "AI Engine and Gemini are currently unreachable. Serving verified statutory guidance in offline mode."
    }
  }
  ```

### 3.2 Statutory Rights Catalog Endpoints
- `GET /api/rights`: Returns all 10 civic categories with active section counts.
- `GET /api/rights/:slug`: Returns verified sections, original text, simplified summaries, and parent acts under a category (e.g. `labour`, `women`, `consumer`).
- `GET /api/rights/search?q=<query>`: Full-text search across statutory sections.

### 3.3 Legal Aid Directory Endpoint
- `GET /api/aid`: Query NALSA, SLSA, and DLSA clinics filtered by `state`, `district`, or `category`. Returns contact numbers, verified address, and Section 12 criteria.

### 3.4 Procedural Workflows Endpoint
- `GET /api/workflows`: List grievance workflows.
- `GET /api/workflows/:category`: Returns ordered procedural steps, required documents, authority routing, and online portal links.

### 3.5 Eligibility Assessment Endpoint
- `POST /api/eligibility`: Evaluates citizen eligibility for 100% free legal representation under NALSA Section 12 statutory criteria.
- **Request Body:**
  ```json
  {
    "income": 85000,
    "category": "WOMEN",
    "state": "Maharashtra",
    "isCustody": false
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "isEligible": true,
      "reason": "Eligible under Section 12(c) of the Legal Services Authorities Act, 1987 (Women are entitled to free legal aid regardless of financial means).",
      "schemes": ["NALSA Free Legal Aid Scheme", "DLSA Empanelled Advocate Representation"],
      "helpline": "15100"
    }
  }
  ```

---

## 4. Backend $\leftrightarrow$ AI Service Contract (Port 8001)

The Express Backend dispatches citizen queries to the Node.js AI Service over internal HTTP:

### 4.1 RAG Query Generation (`POST /query`)
- **Path:** `http://localhost:8001/query`
- **Request Body:**
  ```json
  {
    "message": "Employer not paying salary for 3 months",
    "language": "en",
    "session_id": "a0000000-0000-0000-0000-000000000001",
    "history": [
      { "role": "user", "content": "I work in a factory in Pune." },
      { "role": "assistant", "content": "Welcome. What issue are you experiencing?" }
    ]
  }
  ```
- **Response Body:**
  ```json
  {
    "answer": "Under Section 5 of the Payment of Wages Act, 1936...",
    "language": "en",
    "intent": "LABOUR",
    "citations": [
      {
        "act": "Payment of Wages Act, 1936",
        "section": "Section 5",
        "year": 1936,
        "relevance": "Wages must be paid within 7-10 days.",
        "source_url": "https://www.indiacode.nic.in/handle/123456789/2367"
      }
    ],
    "next_steps": [
      "Gather pay slips and attendance records",
      "File claim under Section 15 before Labour Commissioner"
    ],
    "legal_aid_suggested": true,
    "disclaimer": "This is legal information, not formal legal counsel. For court representation, contact NALSA at 15100.",
    "session_id": "a0000000-0000-0000-0000-000000000001",
    "processing_time_ms": 1420
  }
  ```

### 4.2 Text Vector Embedding (`POST /embed`)
- **Path:** `http://localhost:8001/embed`
- **Request Body:**
  ```json
  {
    "text": "Time of payment of wages and delayed claims recovery"
  }
  ```
- **Response Body:**
  ```json
  {
    "embedding": [0.0241, -0.0185, 0.0412, "... 384 dimensions ..."],
    "dimension": 384,
    "model": "paraphrase-multilingual-MiniLM-L12-v2"
  }
  ```

### 4.3 AI Service Health Probe (`GET /health`)
- **Path:** `http://localhost:8001/health`
- **Response Body:**
  ```json
  {
    "status": "ok",
    "service": "nyayasaathi-ai-engine",
    "version": "1.0.0",
    "llm_provider": "google",
    "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    "embedding_model_loaded": true,
    "gemini_configured": true,
    "details": {
      "llm_model": "gemini-2.5-flash",
      "supabase_configured": true
    }
  }
  ```

---

## 5. Backend Health & Diagnostic Contract (`GET /health`)

- **Path:** `GET /health` and `GET /api/health`
- **Response Shape (`200 OK` when healthy):**
  ```json
  {
    "status": "ok",
    "service": "nyayasaathi-backend",
    "timestamp": "2026-11-14T16:30:00.000Z",
    "version": "1.0.0",
    "dependencies": {
      "supabaseApi": "connected",
      "database": "connected",
      "databaseMessage": "PostgreSQL connection verified via Prisma.",
      "aiEngine": {
        "url": "http://localhost:8001",
        "status": "connected",
        "provider": "google"
      },
      "geminiDirect": {
        "configured": true,
        "model": "gemini-2.5-flash"
      }
    }
  }
  ```
