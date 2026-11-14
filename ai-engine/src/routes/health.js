import { Router } from 'express';
import { config } from '../config.js';
import { embeddingService } from '../services/embeddingService.js';
import { legalService } from '../services/legalService.js';
import { llmService } from '../services/llmService.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const details = {
    gemini_configured: llmService.isConfigured,
    supabase_configured: legalService.isConfigured,
    llm_model: config.geminiModel,
  };

  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'nyayasaathi-ai-engine',
    engine: 'node-javascript',
    llm_provider: config.llmProvider,
    embedding_model: config.embeddingModel,
    database_connected: legalService.isConfigured,
    embedding_model_loaded: embeddingService.isLoaded,
    details,
  });
});
