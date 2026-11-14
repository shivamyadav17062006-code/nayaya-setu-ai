# NyayaSaathi (न्यायसाथी) — Service Startup & Process Lifecycle

This document specifies the three-service startup orchestration, lifecycle management, health verification endpoints, and graceful shutdown behavior for NyayaSaathi.

---

## 1. Process Orchestration Architecture

The NyayaSaathi development environment coordinates three independent, decoupled Node.js services managed via `concurrently` at the root workspace:

```
                          ┌─────────────────────────────┐
                          │   Root npm run dev:full     │
                          │   (concurrently -k)         │
                          └──────────────┬──────────────┘
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │  AI Engine (:8001)  │ │  Backend API (:8000)│ │   Frontend (:3000)  │
      │  Node.js + GenAI    │ │  Node.js + Express  │ │   React 18 + Vite   │
      └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌─────────────────────────────────────────────────────────────────────┐
      │          Supabase PostgreSQL 16 Cloud & pgvector RPC                │
      └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Process Lifecycle & Graceful Termination

### Root Lifecycle (`concurrently -k`)
The root runner uses the `-k` (`--kill-others`) flag:
- When any service exits unexpectedly, `concurrently` immediately sends a termination signal to all other children to prevent orphan processes.
- When `SIGINT` (Ctrl+C) or `SIGTERM` is delivered to the root process, `concurrently` propagates the signal to all children and waits for them to terminate cleanly.

### Service Shutdown Handlers
Both the **Backend API** and **AI Engine** register clean shutdown handlers:
- Catch `SIGTERM` and `SIGINT`.
- Close active HTTP listeners to refuse new incoming requests while finishing in-flight tasks.
- Disconnect database and Prisma client connections cleanly.
- Unhandled rejections and exceptions are trapped and logged to prevent silent failures.

---

## 3. Health Probe Matrix

| Service | Port | Endpoint | Expected Status | Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | `GET /health` | `200 OK` | `{"status":"ok","service":"nyayasaathi-frontend","port":3000}` |
| **Backend API** | `8000` | `GET /health` | `200 OK` | `{"status":"ok","service":"nyayasaathi-backend","dependencies":{...}}` |
| **AI Engine** | `8001` | `GET /health` | `200 OK` | `{"status":"ok","service":"nyayasaathi-ai-engine","engine":"node-javascript",...}` |

---

## 4. Health Verification Commands

Run these health probes against a running instance to verify system availability:

### Frontend Check (Port 3000)
```bash
curl -s http://localhost:3000/health | jq .
```
Expected output:
```json
{
  "status": "ok",
  "service": "nyayasaathi-frontend",
  "port": 3000,
  "timestamp": "2026-11-14T18:15:00.000Z"
}
```

### Backend Check (Port 8000)
```bash
curl -s http://localhost:8000/health | jq .
```
Expected output:
```json
{
  "status": "ok",
  "service": "nyayasaathi-backend",
  "dependencies": {
    "supabaseApi": "connected",
    "aiEngine": {
      "url": "http://localhost:8001",
      "status": "ok"
    }
  }
}
```

### AI Engine Check (Port 8001)
```bash
curl -s http://localhost:8001/health | jq .
```
Expected output:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "nyayasaathi-ai-engine",
  "engine": "node-javascript",
  "llm_provider": "google",
  "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
  "database_connected": true,
  "embedding_model_loaded": true
}
```

---

## 5. Startup Commands Reference

```bash
# Start all three services together
npm run dev:full

# Start individual services
npm run dev:frontend    # Starts Vite dev server on http://localhost:3000
npm run dev:backend     # Starts Express API server on http://localhost:8000
npm run dev:ai          # Starts AI Engine on http://localhost:8001
```
