import { config } from '../config.js';

export class EmbeddingService {
  constructor() {
    this.dim = config.embeddingDim || 384;
    this.isLoaded = true;
  }

  get dimension() {
    return this.dim;
  }

  /**
   * Generates a 384-dimensional normalized vector.
   * Deterministic hash-based projection ensures consistent vector search
   * across Node.js without requiring PyTorch/sentence-transformers.
   */
  async embedText(text) {
    const vector = new Array(this.dim).fill(0);
    if (!text || typeof text !== 'string') {
      return vector;
    }

    const clean = text.toLowerCase().trim();
    // Character and word ngram hashing
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      const idx1 = (code * 31 + i) % this.dim;
      const idx2 = (code * 17 + i * 7) % this.dim;
      vector[idx1] += 0.05;
      vector[idx2] += 0.02;
    }

    const words = clean.split(/\s+/);
    for (let w = 0; w < words.length; w++) {
      let wordHash = 0;
      for (let c = 0; c < words[w].length; c++) {
        wordHash = (wordHash << 5) - wordHash + words[w].charCodeAt(c);
        wordHash |= 0;
      }
      const idx = Math.abs(wordHash) % this.dim;
      vector[idx] += 0.2;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.dim; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }

    return vector;
  }

  async embedBatch(texts) {
    return Promise.all(texts.map((t) => this.embedText(t)));
  }
}

export const embeddingService = new EmbeddingService();
