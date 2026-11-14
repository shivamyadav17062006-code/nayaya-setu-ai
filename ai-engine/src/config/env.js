import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service-level .env first, then root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

/**
 * Sanitizes and validates an API key.
 * Discards default template strings, placeholders, and obvious bogus tokens.
 */
export function sanitizeApiKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('your-') ||
    trimmed.startsWith('[YOUR-') ||
    trimmed.startsWith('<') ||
    trimmed === 'your-gemini-api-key' ||
    trimmed === 'your-service-role-secret-key' ||
    trimmed.length < 15
  ) {
    return null;
  }
  return trimmed;
}

// Conflict Resolution: Prefer GEMINI_API_KEY, fallback to GOOGLE_API_KEY
const rawGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const validGeminiKey = sanitizeApiKey(rawGeminiKey);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.AI_ENGINE_PORT || '8001', 10),
  host: process.env.HOST || '0.0.0.0',

  // Gemini & LLM Configuration
  geminiApiKey: validGeminiKey,
  isGeminiConfigured: Boolean(validGeminiKey),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  llmProvider: process.env.LLM_PROVIDER || (validGeminiKey ? 'google' : 'mock'),
  requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '12000', 10),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),

  // Vector & Database Configuration
  supabaseUrl: process.env.SUPABASE_URL || 'https://rmbfcfigiuyspsdutzov.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW',
  embeddingModel: process.env.EMBEDDING_MODEL || 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || '384', 10),
  ragTopK: parseInt(process.env.RAG_TOP_K || '5', 10),
  ragSimilarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.0'),
};

export default env;
