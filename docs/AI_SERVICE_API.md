# NyayaSaathi — AI Service API Reference

The AI Engine runs on `http://localhost:8001` and serves specialized endpoints for legal language detection, text embeddings, semantic search, and RAG chat generation.

---

## 1. Service Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API discovery manifest & version metadata | None |
| `GET` | `/health` | Service health probe & provider status | None |
| `GET` | `/ready` | Service readiness probe & dependency check | None |
| `POST`| `/chat` | Conversational RAG pipeline (primary chat endpoint) | Internal / Backend |
| `POST`| `/query` | Direct query synthesis with statutory grounding | Internal / Backend |
| `POST`| `/embed` | Generate 384-dimension vector embeddings | Internal / Backend |
| `POST`| `/detect-language`| Indic script classification & language detection | None |
| `POST`| `/translate` | Legal term and statutory phrase translation | None |
| `GET` | `/search` | Direct pgvector semantic search | Internal / Backend |

---

## 2. Detailed Endpoint Specifications

### `GET /health`
Returns service health and active provider configuration.

#### Response `200 OK`:
```json
{
  "status": "healthy",
  "service": "nyayasaathi-ai-engine",
  "version": "1.0.0",
  "uptime": 124.5,
  "engine": "google-gemini",
  "degraded": false
}
```

---

### `POST /chat`
Executes the full RAG pipeline: detects language, retrieves statutory chunks from PostgreSQL `pgvector`, synthesizes citizen advice, and appends legal remedies and NALSA helpline info.

#### Request Body:
```json
{
  "message": "My employer has withheld my salary for 3 months. What can I do?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Namaste! How may I assist you with your legal rights?" }
  ]
}
```

#### Response `200 OK`:
```json
{
  "success": true,
  "response": "Under Section 15 of the Payment of Wages Act, 1936, you have the right to claim unpaid wages...",
  "detectedLanguage": "en",
  "intent": "labour_welfare",
  "citations": [
    {
      "act": "Payment of Wages Act, 1936",
      "section": "Section 15",
      "title": "Claims arising out of deductions from wages or delay in payment of wages",
      "similarity": 0.89
    }
  ],
  "nextSteps": [
    "Serve a written notice to your employer demanding the unpaid wages within 15 days.",
    "File a formal application before the Authority appointed under Section 15 of the Payment of Wages Act.",
    "Contact the nearest District Legal Services Authority (DLSA) or dial NALSA Helpline 15100 for free legal representation."
  ],
  "engine": "gemini-1.5-flash",
  "degraded": false
}
```

---

### `POST /detect-language`
Detects Indic scripts (Devanagari, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Gurmukhi, Odia) and Hinglish.

#### Request Body:
```json
{
  "text": "माझे तीन महिन्यांचे वेतन मिळाले नाही, मी काय करावे?"
}
```

#### Response `200 OK`:
```json
{
  "success": true,
  "language": "mr",
  "script": "Devanagari",
  "confidence": 0.95
}
```

---

### `POST /embed`
Generates normalized vector embeddings compatible with Supabase `pgvector` (`384` dimensions).

#### Request Body:
```json
{
  "content": "Protection of Women from Domestic Violence Act 2005"
}
```

#### Response `200 OK`:
```json
{
  "success": true,
  "embedding": [0.034, -0.012, 0.089, ...],
  "dimensions": 384,
  "model": "text-embedding-004"
}
```

---

### `GET /search?q=query&limit=5&min_similarity=0.3`
Queries `match_legal_chunks` RPC directly via Supabase client.

#### Response `200 OK`:
```json
{
  "success": true,
  "query": "domestic violence",
  "count": 2,
  "results": [
    {
      "chunk_id": "c1a2...",
      "section_number": "12",
      "act_title": "Protection of Women from Domestic Violence Act, 2005",
      "similarity": 0.88
    }
  ]
}
```
