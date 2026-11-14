# NyayaSaathi (न्यायसाथी) — API Reference Manual

**Document Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api`  
**Protocol:** REST via HTTP/1.1 & HTTP/2  
**Format:** JSON (`application/json`)  
**Security:** Helmet headers, CORS allowlist, Express-rate-limit, Zod schema validation  

---

## 1. System Discovery & Health Endpoints

### `GET /api`
- **Description:** Returns the complete NyayaSaathi service manifest and registered endpoint catalog.
- **Auth:** Public
- **Response `200 OK`:**
```json
{
  "success": true,
  "service": "NyayaSaathi API",
  "version": "1.0.0",
  "documentation": "/docs/API_REFERENCE.md",
  "endpoints": { ... }
}
```

### `GET /health` (or `GET /api/health`)
- **Description:** Deep multi-dependency health probe inspecting Supabase REST, PostgreSQL connection pooler via Prisma, AI engine status, and Gemini direct connectivity.
- **Auth:** Public
- **Response `200 OK` (Healthy) or `503 Service Unavailable` (Degraded):**
```json
{
  "status": "ok",
  "service": "nyayasaathi-backend",
  "timestamp": "2026-11-15T01:28:00.000Z",
  "dependencies": {
    "supabaseApi": "connected",
    "database": "connected",
    "databaseMessage": "PostgreSQL reachable — Prisma session-mode pooler verified.",
    "aiEngine": { "url": "http://localhost:8001", "status": "ok", "provider": "google" }
  }
}
```

---

## 2. Authentication & Citizen Management

### `POST /api/auth/register`
- **Description:** Registers a new citizen profile with bcrypt-hashed credentials and returns a signed JWT.
- **Auth:** Public (Rate limited: 25 requests / 15 minutes)
- **Request Body (Zod Validated):**
```json
{
  "email": "citizen@example.com",
  "phone": "+919876543210",
  "password": "SecurePassword123",
  "name": "Priya Sharma",
  "state": "Maharashtra",
  "language": "mr"
}
```
*Note: Either `email` or `phone` is required. `password` must be at least 8 characters with at least one letter and one number.*
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Account registered successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "u0000000-0000-0000-0000-000000000001",
      "email": "citizen@example.com",
      "phone": "+919876543210",
      "name": "Priya Sharma",
      "state": "Maharashtra",
      "language": "mr",
      "role": "USER",
      "createdAt": "2026-11-15T01:28:00.000Z"
    }
  }
}
```
- **Errors:** `400 Bad Request` (Validation), `409 Conflict` (`USER_ALREADY_EXISTS`), `503 Service Unavailable` (DB offline).

### `POST /api/auth/login`
- **Description:** Authenticates citizen credentials, verifies bcrypt hash, and issues a Bearer JWT.
- **Auth:** Public (Rate limited: 25 requests / 15 minutes)
- **Request Body:**
```json
{
  "email": "citizen@example.com",
  "password": "SecurePassword123"
}
```
- **Response `200 OK`:** Returns signed token and user profile.
- **Errors:** `400 Bad Request`, `401 Unauthorized` (`INVALID_CREDENTIALS`).

### `GET /api/auth/me`
- **Description:** Retrieves the authenticated citizen profile.
- **Auth:** Protected (`Authorization: Bearer <token>`)
- **Response `200 OK`:** User record excluding password.
- **Errors:** `401 Unauthorized`, `404 Not Found`.

### `POST /api/auth/logout`
- **Description:** Acknowledges client-side token discard and session termination.
- **Auth:** Public / Bearer
- **Response `200 OK`:** `{ "success": true, "message": "Logged out successfully..." }`

---

## 3. Chat Management & Legal Reasoning

### `POST /api/chat`
- **Description:** Main conversational AI endpoint with RAG context retrieval and PostgreSQL exchange persistence.
- **Auth:** Optional (`optionalAuth` links conversation to citizen profile if logged in)
- **Request Body:**
```json
{
  "message": "My employer has delayed salary payment beyond the 7th. What does the Payment of Wages Act say?",
  "sessionId": "optional-custom-session-uuid",
  "language": "en"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "answer": "Under Section 5 of the Payment of Wages Act, 1936...",
    "sessionId": "sess-uuid",
    "language": "en",
    "sources": [
      {
        "act": "Payment of Wages Act",
        "section": "Section 5",
        "year": 1936,
        "sourceUrl": "https://www.indiacode.nic.in/handle/123456789/2367"
      }
    ],
    "suggestedActions": [ ... ],
    "persisted": true,
    "dbStatus": "connected"
  }
}
```
- **Errors:** `400 Bad Request` (Empty message), `403 Forbidden` (Session belongs to another user), `502 Bad Gateway` (AI Engine unreachable).

### `GET /api/chat/conversations` (alias `GET /api/chat/sessions`)
- **Description:** Lists conversations owned by the authenticated citizen.
- **Auth:** Protected or Query `?sessionId=...`
- **Response `200 OK`:** Array of conversations with message count and preview.

### `POST /api/chat/conversations`
- **Description:** Explicitly initializes a persistent conversation session.
- **Auth:** Optional (`optionalAuth`)
- **Response `201 Created`:** Conversation object.

### `GET /api/chat/conversations/:id`
- **Description:** Retrieves full conversation transcript with messages ordered chronologically.
- **Auth:** Optional / Owner-enforced (403 if private to another user).
- **Response `200 OK`:** Conversation with `messages` array.

### `PATCH /api/chat/conversations/:id`
- **Description:** Updates conversation metadata (e.g. language).
- **Auth:** Owner-enforced.
- **Response `200 OK`:** Updated conversation record.

### `DELETE /api/chat/conversations/:id`
- **Description:** Permanently deletes conversation and cascade deletes all child messages.
- **Auth:** Owner-enforced.
- **Response `200 OK`:** `{ "success": true, "message": "Conversation deleted successfully." }`

---

## 4. Legal Rights & Statutory Knowledge APIs

### `GET /api/rights`
- **Description:** Returns all Indian legal categories (`right_categories`) with verified section counts.
- **Auth:** Public
- **Response `200 OK`:** Array of categories.

### `GET /api/rights/search?q=&limit=&page=`
- **Description:** Multi-column text search across statutory sections, titles, and act names.
- **Auth:** Public
- **Response `200 OK`:** Array of matching sections with pagination metadata.

### `GET /api/rights/acts`
- **Description:** Lists all Indian legal acts (`legal_acts`) with jurisdiction, status, and verification metadata.
- **Auth:** Public
- **Response `200 OK`:** Array of acts with section counts.

### `GET /api/rights/acts/:id`
- **Description:** Retrieves detailed act metadata with all constituent statutory sections.
- **Auth:** Public
- **Response `200 OK`:** Act record with embedded `sections` array.

### `GET /api/rights/sections`
- **Description:** Paginated catalog of all legal sections with act citations and remedies.
- **Auth:** Public
- **Response `200 OK`:** Array of sections.

### `GET /api/rights/sections/:id`
- **Description:** Single statutory section by UUID or section identifier with act and remedy details.
- **Auth:** Public
- **Response `200 OK`:** Section record.

### `GET /api/rights/beneficiaries`
- **Description:** Lists vulnerable citizen groups recognized under Indian affirmative legislation.
- **Auth:** Public
- **Response `200 OK`:** Array of beneficiary groups.

### `GET /api/rights/:slug`
- **Description:** Category details and associated statutory sections by category slug (e.g., `labour`, `women`, `consumer`).
- **Auth:** Public
- **Response `200 OK`:** Category object with `sections` array.

---

## 5. Legal Aid & Action Navigator APIs

### `GET /api/aid`
- **Description:** Directory of free legal services authorities (`legal_aid_providers`) with filters (`state`, `district`, `type`).
- **Auth:** Public
- **Response `200 OK`:** Array of provider records with official contact details and helplines.

### `GET /api/aid/districts/:state`
- **Description:** Returns unique districts with legal aid offices for a given state.
- **Auth:** Public
- **Response `200 OK`:** Array of district strings.

### `GET /api/aid/:id`
- **Description:** Detailed information for a specific legal aid provider.
- **Auth:** Public
- **Response `200 OK`:** Provider record.

### `POST /api/aid/nalsa-eligibility`
- **Description:** Fast NALSA criteria check under Section 12 of the Legal Services Authorities Act, 1987.
- **Auth:** Public
- **Request Body:** `{ "annualIncome": 50000, "category": "WORKERS" }`
- **Response `200 OK`:** `{ "eligible": true, "reason": "...", "helpline": "15100" }`

### `GET /api/workflows`
- **Description:** Lists step-by-step grievance and complaint workflows (`complaint_workflows`).
- **Auth:** Public
- **Response `200 OK`:** Array of workflows with ordered step sequences.

### `GET /api/workflows/:category`
- **Description:** Retrieves specific complaint workflow with document checklist and competent authorities.
- **Auth:** Public
- **Response `200 OK`:** Workflow object.

### `POST /api/eligibility`
- **Description:** Full statutory legal aid eligibility assessment evaluating Section 12 criteria, income limits, and state schemes.
- **Auth:** Public
- **Request Body (Zod Validated):**
```json
{
  "income": 75000,
  "state": "Maharashtra",
  "category": "LABOUR",
  "beneficiaryType": "WORKERS",
  "age": 32
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "schemes": [ ... ],
    "reason": "You qualify on both income grounds...",
    "referralLink": "https://nalsa.gov.in"
  }
}
```
