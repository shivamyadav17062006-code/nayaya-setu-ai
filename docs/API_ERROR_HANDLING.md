# NyayaSaathi (न्यायसाथी) — API Error Handling Strategy

**Version:** 1.0.0  
**Scope:** Express Backend, Validation Middleware, and Client-Side Handlers  

---

## 1. Core Principles

1. **Structured & Predictable Responses:** All error responses adhere to a uniform JSON shape.
2. **Explicit Failure Separation:** Never return `HTTP 200 OK` when generation or persistence has critically failed. Distinguish between AI reasoning failures (`502`), database persistence offline (`503`), authentication failures (`401`), and schema validation failures (`400`).
3. **Zero Secrets Leakage:** Never leak database connection strings, passwords, or raw PostgreSQL internal traces to clients in production mode.
4. **Resilient Degradation:** Non-critical background logging failures (e.g. transient DB write failure during chat) do not crash the service; they report explicit persistence diagnostics (`persisted: false, dbStatus: "offline"`).

---

## 2. Standard Error Response Contract

```json
{
  "success": false,
  "error": "Human-readable error explanation.",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ],
  "debug": {
    "stack": "Stack trace (Only present when NODE_ENV === 'development')",
    "code": "P2002"
  }
}
```

---

## 3. Failure Domain Classification

### A. Schema & Input Validation Failures (`400 Bad Request`)
- **Origin:** Zod runtime validation middleware (`backend/src/middleware/validate.js`).
- **Codes:** `VALIDATION_FAILED`, `BAD_REQUEST`.
- **Handling:** Formatted array of field-level errors forwarded to client.

### B. Authentication & Authorization Failures (`401 Unauthorized` / `403 Forbidden`)
- **Origin:** Auth middleware (`authenticate`, `requireAdmin`, ownership guards).
- **Codes:** `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `FORBIDDEN_CONVERSATION_ACCESS`.
- **Handling:** Client clears stale tokens on 401; 403 alerts citizen to lack of resource ownership.

### C. Resource Not Found (`404 Not Found`)
- **Origin:** Missing statutory sections, unknown acts, or un-routed endpoints.
- **Codes:** `NOT_FOUND`.

### D. Conflict & Concurrency (`409 Conflict`)
- **Origin:** Prisma unique constraint violations (`P2002`).
- **Codes:** `USER_ALREADY_EXISTS`, `DUPLICATE_RESOURCE`.

### E. AI Service & Gateway Failures (`502 Bad Gateway` / `503 Service Unavailable`)
- **Origin:** AI Engine (:8001) unreachable, Gemini rate limits, or empty response generation.
- **Codes:** `AI_SERVICE_UNAVAILABLE`, `AI_EMPTY_RESPONSE`.

### F. Database Persistence Failures (`503 Service Unavailable` / Degraded State)
- **Origin:** PostgreSQL connection timeout, pooler exhaustion, or offline database.
- **Codes:** `DB_UNAVAILABLE`, `DB_OFFLINE`.
- **Handling:** Chat continues in stateless mode with `persisted: false` and explanatory `dbWarning` banner.

---

## 4. Rate Limiting Protection (`429 Too Many Requests`)

| Tier | Window | Max Requests | Target Routes |
| :--- | :--- | :--- | :--- |
| **Global API** | 15 minutes | 200 requests | All `/api/*` endpoints |
| **AI Chat** | 1 minute | 30 requests | `/api/chat` |
| **Authentication** | 15 minutes | 25 requests | `/api/auth/login`, `/api/auth/register` |
