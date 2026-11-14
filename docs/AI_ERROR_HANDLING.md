# NyayaSaathi — AI Error Handling & Resilience Strategy

## 1. Principles of AI Resilience

A citizen seeking urgent legal awareness must never experience an unhandled crash or a generic 500 error. The NyayaSaathi AI engine implements a defense-in-depth failure handling strategy:

1. **Explicit Error Classification**: Distinguishes authentication, quota, rate-limit, network timeout, and validation errors.
2. **Never Silent Failure**: Prevents converting upstream failures into blank 200 OK responses.
3. **Graceful Fallback**: Automatically serves pre-indexed statutory guidance via `MockProvider` when Gemini is unavailable, tagging the response with `degraded: true`.
4. **Actionable UI Recovery**: Returns structured error metadata enabling the React frontend to display clear error notices with a one-click **"Retry Question"** button.

---

## 2. Standardized Error Codes

The AI service classifies all exceptions using standardized application error codes:

| Error Code | HTTP Status | Trigger Condition | Resilience / Recovery Behavior |
| :--- | :--- | :--- | :--- |
| `INVALID_CREDENTIALS` | 401 / 503 | Malformed or revoked Gemini API key | Fallback to `MockProvider` with `degraded: true` |
| `RATE_LIMITED` | 429 | Google Cloud RPM/TPM limit exceeded | Exponential backoff (3 attempts); fallback on exhaustion |
| `QUOTA_EXHAUSTED` | 429 / 503 | Daily billing or token quota depleted | Switch immediately to `MockProvider` (degraded mode) |
| `TIMEOUT` | 504 | Upstream call exceeds `AI_TIMEOUT_MS` (30s) | Retry once, then fallback to cached statutory response |
| `PROVIDER_UNAVAILABLE`| 503 | Network outage or DNS resolution failure | Fallback to `MockProvider` |
| `VALIDATION_ERROR` | 400 | Missing query text or invalid request body | Reject with detailed Zod field error array |
| `MALFORMED_OUTPUT` | 502 | LLM returned unparseable response | Sanitize response and inject standard statutory disclaimer |

---

## 3. Resilient Fallback Architecture

```text
Citizen Request
      │
      ▼
ProviderManager.generateResponse()
      │
      ├──▶ [Try GeminiProvider] ──▶ (Success) ──▶ Return { degraded: false }
      │           │
      │       (Failure: 429, 401, Timeout)
      │           ▼
      └──▶ [Catch & Log Sanitized Error]
                  │
                  ▼
           [Activate MockProvider]
                  │
                  ▼
      Return Grounded Statutory Guidance
      + { degraded: true, warning: "Operating in offline statutory awareness mode" }
      + NALSA Helpline (15100) & DLSA Directory
```

---

## 4. Frontend Error UI & Retry Flow

When a network failure or unrecoverable error occurs:
1. `useChat.js` catches the error, records `isError: true`, and stores `retryText`.
2. `Chat.jsx` clears the thinking spinner and renders an alert card:
   ```jsx
   {isError && (
     <div className="alert alert-error">
       <span>Failed to retrieve AI analysis.</span>
       <button onClick={() => sendMessage(retryText)}>Retry Question</button>
     </div>
   )}
   ```
3. Citizen can re-submit the question with a single click without losing their input text.
