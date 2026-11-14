# NyayaSaathi — Google Gemini JavaScript SDK Setup & Configuration

## 1. SDK Overview

NyayaSaathi uses the official Google Gen AI JavaScript SDK:
```bash
npm install @google/genai
```
Integrated across the Node.js AI Engine (`ai-engine/`), this library replaces all legacy Python microservices with modern JavaScript ES Modules.

---

## 2. Environment Variables & Key Resolution Precedence

The AI engine automatically resolves the Gemini API key using strict hierarchical precedence:

```javascript
// ai-engine/src/config/env.js
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
```

### Supported Environment Variables:

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Primary API key for Google Gemini | (None) | Yes (for live LLM) |
| `GOOGLE_API_KEY` | Secondary fallback key alias | (None) | Optional |
| `GEMINI_MODEL` | Text generation & chat model | `gemini-1.5-flash` | No |
| `GEMINI_EMBEDDING_MODEL` | Text embedding model | `text-embedding-004`| No |
| `AI_MAX_RETRIES` | Exponential backoff attempts | `3` | No |
| `AI_TIMEOUT_MS` | Request execution timeout | `30000` (30s) | No |
| `AI_PROVIDER` | Default active AI provider | `auto` (`gemini` or `mock` fallback) | No |

---

## 3. Client Initialization with Error Boundary

The client initializes in `ai-engine/src/providers/geminiProvider.js`:

```javascript
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { sanitizeApiKey } from '../config/index.js';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey, config = {}) {
    super();
    this.apiKey = apiKey || env.geminiApiKey;
    this.model = config.model || env.geminiModel || 'gemini-1.5-flash';
    this.embeddingModel = config.embeddingModel || env.geminiEmbeddingModel || 'text-embedding-004';
    
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
      console.log(`[GeminiProvider] Initialized with key: ${sanitizeApiKey(this.apiKey)}`);
    } else {
      console.warn('[GeminiProvider] Initialized without API key (fallback mode)');
    }
  }
}
```

---

## 4. Rate Limiting, Timeouts & Backoff Strategy

To handle high traffic, Google Cloud quotas, and network instability:

1. **Request Timeout Wrapper (`withTimeout`)**:
   Every Gemini API call is wrapped in a Promise race against a 30-second abort timer (`AI_TIMEOUT_MS`).
2. **Exponential Backoff (`withRetry`)**:
   Transient errors (HTTP 429 Rate Limit, HTTP 503 Service Unavailable) trigger automatic retries:
   $$\text{Delay} = \text{baseDelay} \times 2^{\text{attempt}} + \text{jitter}$$
   Retries are capped at `AI_MAX_RETRIES` (default: 3).
3. **Graceful Fallback**:
   If retries are exhausted or credentials fail (`INVALID_CREDENTIALS`), `ProviderManager` automatically switches the request to `MockProvider`, returning a legally grounded response flagged with `degraded: true`.

---

## 5. Security & Secret Protection

- **Key Masking**: System startup prints only masked keys (`AIza...8B2x`) and never reveals secrets in stack traces or logs.
- **Frontend Isolation**: No Gemini API keys are accessible to the browser client. All LLM calls pass through the Express backend proxy on port 8000.
