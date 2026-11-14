/**
 * Abstract Base AI Provider
 * Any generative AI provider (Google Gemini, Claude, local models, or Mock)
 * must implement this contract.
 */
export class BaseProvider {
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new TypeError('Cannot construct BaseProvider instances directly.');
    }
    this.name = name;
  }

  /**
   * Returns whether the provider has valid credentials and is initialized.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('Method isConfigured() must be implemented.');
  }

  /**
   * Health/readiness probe for the provider.
   * @returns {Promise<{ ready: boolean, message?: string }>}
   */
  async checkReadiness() {
    throw new Error('Method checkReadiness() must be implemented.');
  }

  /**
   * Generates a conversational legal awareness response.
   * @param {Object} options
   * @param {string} options.systemPrompt
   * @param {string} options.userPrompt
   * @param {string} [options.language]
   * @param {string} [options.intent]
   * @param {number} [options.temperature]
   * @param {number} [options.timeoutMs]
   * @returns {Promise<string>}
   */
  async generateContent(_options) {
    throw new Error('Method generateContent() must be implemented.');
  }

  /**
   * Generates raw unstructured output (e.g. for JSON extraction or classification).
   * @param {string} _prompt
   * @returns {Promise<string>}
   */
  async generateRaw(_prompt) {
    throw new Error('Method generateRaw() must be implemented.');
  }
}

export default BaseProvider;
