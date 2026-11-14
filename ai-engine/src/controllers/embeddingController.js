import { v4 as uuidv4 } from 'uuid';
import { embeddingService } from '../services/embeddingService.js';
import { legalService } from '../services/legalService.js';
import { env } from '../config/env.js';

export async function handleEmbed(req, res, next) {
  try {
    const { content, section_id, language = 'en', metadata = {} } = req.body;

    const vector = await embeddingService.embedText(content);

    let stored = false;
    if (section_id && legalService.isConfigured) {
      stored = await legalService.storeChunk({
        section_id,
        content,
        embedding: vector,
        language,
        source_url: metadata?.source_url,
      });
    }

    res.status(200).json({
      id: `vec_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      section_id: section_id || null,
      embedding_dim: vector.length,
      stored,
      model: env.embeddingModel,
      message: stored
        ? 'Vector embedding generated and indexed in Supabase pgvector.'
        : 'Vector embedding generated successfully (stateless).',
      vector: req.query.include_vector === 'true' ? vector : undefined,
    });
  } catch (err) {
    next(err);
  }
}
