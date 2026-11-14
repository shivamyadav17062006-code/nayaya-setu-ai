import { GeminiProvider } from './geminiProvider.js';
import { MockProvider } from './mockProvider.js';
import { env } from '../config/env.js';

export class ProviderManager {
  constructor() {
    this.gemini = new GeminiProvider();
    this.mock = new MockProvider();
  }

  /**
   * Retrieves the primary provider instance according to system configuration
   */
  getPrimaryProvider() {
    if (env.llmProvider === 'google' && this.gemini.isConfigured()) {
      return this.gemini;
    }
    return this.mock;
  }

  /**
   * Returns metadata regarding provider readiness and configuration status
   */
  async getStatus() {
    const isGeminiReady = this.gemini.isConfigured();
    const activeProvider = this.getPrimaryProvider();

    return {
      activeProvider: activeProvider.name,
      configuredProvider: env.llmProvider,
      gemini: {
        configured: isGeminiReady,
        model: env.geminiModel,
      },
      mock: {
        configured: true,
      },
    };
  }

  /**
   * Generates conversational content.
   * If the primary provider fails due to network or quota, gracefully falls back to Mock
   * while reporting explicit degradation metadata.
   */
  async generateContent(options) {
    const primary = this.getPrimaryProvider();

    try {
      const answer = await primary.generateContent(options);
      return {
        answer,
        provider: primary.name,
        degraded: false,
        warning: null,
      };
    } catch (primaryErr) {
      console.warn(`[ProviderManager] Primary provider (${primary.name}) failed: ${primaryErr.message}. Executing resilient fallback to statutory mock engine.`);

      const fallbackAnswer = await this.mock.generateContent(options);
      return {
        answer: fallbackAnswer,
        provider: this.mock.name,
        degraded: true,
        warning: `AI provider encountered an error (${primaryErr.code || 'UNAVAILABLE'}). Serving verified statutory guidance in offline awareness mode.`,
      };
    }
  }

  /**
   * Generates raw output for internal tasks (classification, translation)
   */
  async generateRaw(prompt, options) {
    const primary = this.getPrimaryProvider();
    try {
      return await primary.generateRaw(prompt, options);
    } catch {
      return await this.mock.generateRaw(prompt, options);
    }
  }
}

export const providerManager = new ProviderManager();
export default providerManager;
