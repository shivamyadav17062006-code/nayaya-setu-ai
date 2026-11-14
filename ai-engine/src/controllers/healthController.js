import { env } from '../config/env.js';
import { providerManager } from '../providers/providerManager.js';
import { embeddingService } from '../services/embeddingService.js';
import { legalService } from '../services/legalService.js';

export async function getHealth(_req, res) {
  const providerStatus = await providerManager.getStatus();

  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    service: 'nyayasaathi-ai-engine',
    engine: 'node-javascript',
    llm_provider: env.llmProvider,
    embedding_model: env.embeddingModel,
    database_connected: legalService.isConfigured,
    embedding_model_loaded: embeddingService.isLoaded,
    details: {
      gemini_configured: providerStatus.gemini.configured,
      supabase_configured: legalService.isConfigured,
      llm_model: env.geminiModel,
      active_provider: providerStatus.activeProvider,
    },
  });
}

export async function getReadiness(_req, res) {
  const primaryProvider = providerManager.getPrimaryProvider();
  const providerProbe = await primaryProvider.checkReadiness();
  const dbConfigured = legalService.isConfigured;

  const isReady = providerProbe.ready && embeddingService.isLoaded;

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    service: 'nyayasaathi-ai-engine',
    timestamp: new Date().toISOString(),
    probes: {
      provider: {
        name: primaryProvider.name,
        ready: providerProbe.ready,
        message: providerProbe.message || 'Ready',
      },
      embedding: {
        model: env.embeddingModel,
        dimensions: env.embeddingDim,
        loaded: embeddingService.isLoaded,
      },
      database: {
        configured: dbConfigured,
      },
    },
  });
}
