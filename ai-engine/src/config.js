import dotenv from 'dotenv';
dotenv.config();

function sanitizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('your-') ||
    trimmed.startsWith('[YOUR-') ||
    trimmed.startsWith('<') ||
    trimmed.length < 15
  ) {
    return '';
  }
  return trimmed;
}

export const config = {
  port: parseInt(process.env.AI_ENGINE_PORT || '8001', 10),
  host: process.env.HOST || '0.0.0.0',
  geminiApiKey: sanitizeKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  llmProvider: process.env.LLM_PROVIDER || (sanitizeKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'google' : 'mock'),
  supabaseUrl: process.env.SUPABASE_URL || 'https://rmbfcfigiuyspsdutzov.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW',
  embeddingModel: process.env.EMBEDDING_MODEL || 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || '384', 10),
  ragTopK: parseInt(process.env.RAG_TOP_K || '5', 10),
  ragSimilarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.3'),
};
