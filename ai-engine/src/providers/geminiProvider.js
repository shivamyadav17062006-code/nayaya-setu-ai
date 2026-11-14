import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './baseProvider.js';
import { env } from '../config/env.js';
import { withRetry, withTimeout } from '../utils/retry.js';

export class GeminiProvider extends BaseProvider {
  constructor() {
    super('google-gemini');
    this.client = null;
    this.modelName = env.geminiModel;
    this.timeoutMs = env.requestTimeoutMs;
    this.maxRetries = env.maxRetries;

    if (env.geminiApiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: env.geminiApiKey });
      } catch (err) {
        console.warn('[GeminiProvider] GoogleGenAI initialization warning:', err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.client && env.geminiApiKey);
  }

  /**
   * Sanitizes any error message so that API keys or query secrets are never exposed in logs
   */
  sanitizeErrorMessage(err) {
    if (!err) return 'Unknown error';
    let msg = err.message || String(err);
    if (env.geminiApiKey) {
      msg = msg.split(env.geminiApiKey).join('[REDACTED_API_KEY]');
    }
    return msg;
  }

  /**
   * Probe to check provider readiness
   */
  async checkReadiness() {
    if (!this.isConfigured()) {
      return {
        ready: false,
        message: 'GEMINI_API_KEY is not configured or is a placeholder token.',
      };
    }

    try {
      // Lightweight verification call with strict 5-second timeout
      const testCall = this.client.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
      });
      const response = await withTimeout(testCall, 5000, 'Gemini readiness check timed out');
      if (response && response.text) {
        return { ready: true, model: this.modelName };
      }
      return { ready: false, message: 'Gemini responded with empty text' };
    } catch (err) {
      const sanitized = this.sanitizeErrorMessage(err);
      return { ready: false, message: sanitized };
    }
  }

  /**
   * Generates conversational content using Gemini
   */
  async generateContent(options) {
    const {
      systemPrompt,
      userPrompt,
      temperature = 0.2,
      timeoutMs = this.timeoutMs,
    } = options;

    if (!this.isConfigured()) {
      const err = new Error('Gemini API key is not configured.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const executeCall = async () => {
      const callPromise = this.client.models.generateContent({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        config: {
          temperature,
        },
      });

      const response = await withTimeout(callPromise, timeoutMs, `Gemini request exceeded ${timeoutMs}ms timeout`);
      if (response && response.text && response.text.trim().length > 0) {
        return response.text;
      }
      const emptyErr = new Error('Gemini generated an empty response.');
      emptyErr.code = 'MALFORMED_OUTPUT';
      throw emptyErr;
    };

    try {
      return await withRetry(executeCall, {
        maxRetries: this.maxRetries,
        initialDelayMs: 600,
      });
    } catch (err) {
      const sanitized = this.sanitizeErrorMessage(err);
      const classifiedError = new Error(sanitized);

      if (/429|quota|rate limit/i.test(sanitized)) {
        classifiedError.code = 'QUOTA_EXHAUSTED';
      } else if (/timeout/i.test(sanitized)) {
        classifiedError.code = 'TIMEOUT';
      } else if (/api_key|unauthorized|auth|permission/i.test(sanitized)) {
        classifiedError.code = 'INVALID_CREDENTIALS';
      } else if (/not found|model/i.test(sanitized)) {
        classifiedError.code = 'INVALID_MODEL';
      } else {
        classifiedError.code = 'PROVIDER_UNAVAILABLE';
      }

      throw classifiedError;
    }
  }

  /**
   * Generates raw unstructured output
   */
  async generateRaw(prompt, timeoutMs = 8000) {
    if (!this.isConfigured()) {
      const err = new Error('Gemini API key is not configured.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    try {
      const callPromise = this.client.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const response = await withTimeout(callPromise, timeoutMs, 'Gemini raw call timed out');
      return response?.text || '';
    } catch (err) {
      throw new Error(this.sanitizeErrorMessage(err));
    }
  }
}

export default GeminiProvider;
