# Chat Persistence & Session Lifecycle — NyayaSaathi (न्यायसाथी)

This document describes how user inquiries, AI statutory responses, and conversation sessions are persisted and retrieved across PostgreSQL and client local storage.

---

## 1. Relational Data Model

Chat history is modeled using normalized relational entities in Supabase PostgreSQL:

```
  ┌───────────────────────┐
  │         users         │
  ├───────────────────────┤
  │ id: UUID (PK)         │
  │ email: String (Unique)│
  │ role: "USER"|"ADMIN"  │
  └───────────┬───────────┘
              │ 1
              │
              │ 0..*
  ┌───────────▼───────────┐
  │     conversations     │
  ├───────────────────────┤
  │ id: UUID (PK)         │
  │ session_id: String(UQ)│
  │ user_id: UUID (FK)    │
  │ language: String      │
  │ created_at: Timestamp │
  └───────────┬───────────┘
              │ 1
              │
              │ 0..*
  ┌───────────▼───────────┐
  │       messages        │
  ├───────────────────────┤
  │ id: UUID (PK)         │
  │ conversation_id: (FK) │
  │ role: "user"|"asst"   │
  │ content: Text         │
  │ metadata: JSONB       │
  │ created_at: Timestamp │
  └───────────────────────┘
```

---

## 2. Request & Persistence Flow (`POST /api/chat`)

```
Citizen Browser              Express Backend                 AI Engine               Supabase DB
      │                             │                            │                        │
      │── 1. POST /api/chat ───────>│                            │                        │
      │   { message, sessionId }    │                            │                        │
      │                             │── 2. find/createConv ──────────────────────────────>│
      │                             │<── 3. conversationRecord ──────────────────────────│
      │                             │                            │                        │
      │                             │── 4. saveUserMessage ──────────────────────────────>│
      │                             │                            │                        │
      │                             │── 5. queryAIEngine() ─────>│                        │
      │                             │<── 6. { answer, citations }│                        │
      │                             │                            │                        │
      │                             │── 7. saveAssistantMessage ─────────────────────────>│
      │                             │                            │                        │
      │<─ 8. { answer, persisted }──│                            │                        │
```

### Steps Explained
1. **Request Intake**: Validates query text, sessionId, and requested language (ISO 639-1 code).
2. **Session Identification**: Resolves or generates a unique `sessionId` (UUIDv4).
3. **Database Write (User)**: When Prisma is configured and connected, retrieves the conversation record or creates one, then inserts the user prompt with timestamp.
4. **AI Synthesis**: Dispatches query to the Node.js RAG Engine (`:8001`) with context from previous messages.
5. **Database Write (Assistant)**: Saves the statutory response, citations, and metadata.
6. **Persistence Confirmation**: Sets `persisted: true` in the HTTP response.

---

## 3. Graceful Offline Degradation (Stateless Mode)

If the PostgreSQL connection is unreachable or `DATABASE_URL` contains unconfigured placeholders:
- The backend does **not** fail or abort the chat query.
- It logs a diagnostic warning to the server console: `[ChatController] DB write failed — running stateless`.
- The AI Engine continues to generate verified legal statutory advice.
- The HTTP response explicitly returns:
  ```json
  {
    "success": true,
    "data": {
      "answer": "Under Section 5 of the Payment of Wages Act, 1936...",
      "persisted": false,
      "dbStatus": "placeholder",
      "dbWarning": "Database not configured: DATABASE_URL in backend/.env still contains placeholder tokens. Chat history will not be saved."
    }
  }
  ```

---

## 4. Frontend Resilience & Local Storage Backup

The React frontend (`useChat.js` and `Chat.jsx`) handles persistence transparently:

1. **Dual Storage**: Every message exchange is saved immediately into `localStorage` (`nyayasaathi_sessions`), ensuring that user inquiries are never lost during browser reloads or transient network drops.
2. **Persistence Warning Banner**: When `dbPersisted === false` or `dbStatus !== 'connected'`, a dedicated banner is displayed at the top of the chat area:
   - Explains that the session is in **Local Session Mode**.
   - Assures the citizen that responses are fully live and accurate.
   - Provides a **Retry** button that re-probes `GET /api/chat/db-status`.
3. **Security Guardrail**: Internal database credentials, passwords, and SQL stack traces are **never** rendered in the browser UI.
