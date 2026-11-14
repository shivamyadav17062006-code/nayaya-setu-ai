import { Router } from 'express';
import crypto from 'crypto';
import { embeddingService } from '../services/embeddingService.js';
import { legalService } from '../services/legalService.js';

export const embedRouter = Router();

embedRouter.post('/embed', async (req, res, next) => {
  try {
    const { content, section_id, language = 'en', metadata = {} } = req.body || {};
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ detail: 'Content is required.' });
    }

    const vector = await embeddingService.embedText(content);
    const sourceUrl = metadata.source_url || null;

    const stored = await legalService.storeChunk(
      section_id,
      content,
      vector,
      language,
      sourceUrl
    );

    res.json({
      id: `vec_${crypto.randomBytes(6).toString('hex')}`,
      section_id: section_id || null,
      embedding_dim: vector.length,
      stored,
      message: stored
        ? 'Embedding generated and indexed in Supabase'
        : 'Embedding generated but not stored (Supabase unavailable or section_id missing)',
    });
  } catch (err) {
    next(err);
  }
});
