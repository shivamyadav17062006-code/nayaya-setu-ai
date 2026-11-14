# Database Connection Guide — NyayaSaathi (न्यायसाथी)

This guide documents the PostgreSQL database architecture, connection pooler configuration, error diagnostics, and connection recovery procedures for NyayaSaathi.

---

## 1. Architecture Overview

NyayaSaathi utilizes a hybrid dual-path data access architecture powered by **Supabase PostgreSQL** with `pgvector`:

```
                           ┌─────────────────────────────────────────┐
                           │            NyayaSaathi Client           │
                           │           (React 18 + Vite)             │
                           └────────────────────┬────────────────────┘
                                                │ HTTP / REST
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │          Express Backend (:8000)        │
                           └────────┬───────────────────────┬────────┘
                                    │                       │
               Prisma Client (JS)   │                       │ Supabase JS SDK
           (Conversations, Users)   │                       │ (Statutory Data, pgvector)
                                    ▼                       ▼
      ┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
      │       Supabase Session Pooler          │ │          Supabase REST / RPC           │
      │  aws-0-ap-south-1.pooler.supabase.com  │ │   https://rmbfcfigiuyspsdutzov...       │
      │              (Port 5432)               │ │             (HTTPS / 443)              │
      └───────────────────┬────────────────────┘ └───────────────────┬────────────────────┘
                          │                                          │
                          └─────────────────┬────────────────────────┘
                                            ▼
                           ┌─────────────────────────────────────────┐
                           │        Supabase PostgreSQL 15+         │
                           │   - 10 Statutory Knowledge Tables       │
                           │   - 4 Application Persistence Tables    │
                           │   - pgvector `match_legal_chunks` RPC   │
                           └─────────────────────────────────────────┘
```

### Dual-Path Separation
1. **Statutory Knowledge & pgvector (Supabase REST / RPC)**:
   - Queries `legal_acts`, `legal_sections`, `right_categories`, `complaint_workflows`, and `legal_aid_providers`.
   - Executes semantic similarity vector searches via RPC `match_legal_chunks`.
   - Authenticates via Supabase Publishable/Anon Key over HTTPS (Port 443).
   - Fully operational and tested.

2. **Session & Message Persistence (Prisma Client)**:
   - Persists `users`, `conversations`, and `messages` models.
   - Connects directly to PostgreSQL over TCP (Port 5432).
   - Requires Supabase Database Password.
   - Includes automatic graceful degradation to browser local storage if database credentials are not yet configured.

---

## 2. Diagnosis of Previous Errors

### Error 1: "Invalid domain character in database URL"
```text
The provided database string is invalid.
Error parsing connection string: invalid domain character in database URL.
```
- **Root Cause**: The environment variable `DATABASE_URL` contained literal bracket characters `[` and `]` (e.g. `[YOUR-PASSWORD]`). According to RFC 3986 and WHATWG URL specifications, square brackets in the authority segment of a URL are strictly reserved for IPv6 host literals (e.g. `[::1]`). When a URL parser encounters brackets in the user/password segment, it treats them as an invalid host specification.
- **Resolution**:
  - Implemented `validateDatabaseUrl()` in `backend/src/lib/prisma.js` to intercept bracket characters before Prisma attempts to parse them.
  - Implemented URL-encoding guidelines for passwords with special characters.

### Error 2: "Can't reach database server at db.rmbfcfigiuyspsdutzov.supabase.co:5432"
```text
Can't reach database server at
db.rmbfcfigiuyspsdutzov.supabase.co:5432
```
- **Root Cause**: The hostname `db.[project-ref].supabase.co` resolves exclusively to an IPv6 address. Most local ISP networks, VPNs, and home routers lack native IPv6 routing, resulting in connection timeouts (`ETIMEDOUT` or `ENETUNREACH`).
- **Resolution**:
  - Local development and runtime applications must connect through the **Supabase Session Pooler** (`aws-0-ap-south-1.pooler.supabase.com`), which resolves to IPv4.
  - The direct hostname (`db.[project-ref].supabase.co`) is reserved strictly for `DIRECT_URL` during migrations if IPv6 is available, or when run inside cloud container networks with dual-stack support.

### Error 3: "DB session logging skipped (DB offline)"
```text
DB session logging skipped (DB offline)
```
- **Root Cause**: This is an intentional and safe fallback mechanism. When the database is offline or unconfigured, NyayaSaathi prevents requests from failing with a 500 error by running in stateless mode.
- **Resolution**:
  - Upgraded the chat controller to return explicit metadata (`persisted: false`, `dbStatus: "placeholder"`, `dbWarning`).
  - Added a visual warning banner in the React frontend chat view informing users that the session is running in local storage mode without cloud persistence.

---

## 3. Configuration Details

### Project Coordinates (Supabase)
- **Project Ref**: `rmbfcfigiuyspsdutzov`
- **Region**: `ap-south-1` (Mumbai, India)
- **REST URL**: `https://rmbfcfigiuyspsdutzov.supabase.co`
- **Session Pooler Host**: `aws-0-ap-south-1.pooler.supabase.com`
- **Pooler Port**: `5432` (Session mode) or `6543` (Transaction mode)
- **Direct Host**: `db.rmbfcfigiuyspsdutzov.supabase.co`
- **Default Database**: `postgres`
- **Default User**: `postgres.rmbfcfigiuyspsdutzov` (Pooler) / `postgres` (Direct)

### Password URL Encoding Rules
If your Supabase database password contains reserved URI characters, they **must** be URL-encoded in the connection string:

| Character | URL Encoded |
|-----------|-------------|
| `@`       | `%40`       |
| `#`       | `%23`       |
| `$`       | `%24`       |
| `%`       | `%25`       |
| `&`       | `%26`       |
| `+`       | `%2B`       |
| `/`       | `%2F`       |
| `:`       | `%3A`       |
| `?`       | `%3F`       |

*Example in Node.js:*
```javascript
const encodedPassword = encodeURIComponent("MyP@ss#123");
// Result: "MyP%40ss%23123"
```

### Connection String Formatting

#### Application Runtime (Session Pooler — Recommended for Prisma)
```bash
DATABASE_URL="postgresql://postgres.rmbfcfigiuyspsdutzov:YOUR_ENCODED_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

#### Migration & Schema Diffing (Direct URL)
```bash
DIRECT_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@db.rmbfcfigiuyspsdutzov.supabase.co:5432/postgres?sslmode=require"
```

---

## 4. Verification Procedures

### 1. Validate Schema
```bash
cd backend
npx prisma validate
```

### 2. Verify Supabase REST & pgvector
```bash
npm run db:check
```

### 3. Check Live Connection
```bash
curl http://localhost:8000/api/chat/db-status
```
Expected response when configured:
```json
{
  "success": true,
  "data": {
    "configured": true,
    "configStatus": "configured",
    "connected": true,
    "status": "connected",
    "message": "PostgreSQL reachable — Prisma session-mode pooler verified."
  }
}
```
