import { Router } from 'express';
import { legalService } from '../services/legalService.js';

export const searchRouter = Router();

searchRouter.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit || '5', 10);
    const language = req.query.language || 'en';

    if (!q || q.length < 2) {
      return res.status(400).json({ detail: 'Search query must be at least 2 characters.' });
    }

    const provisions = await legalService.semanticSearch(q, limit);

    const results = provisions.map((provision, index) => ({
      id: String(provision.chunk_id || `res_${index}`),
      section_id: provision.section_id || null,
      content: provision.simplified || provision.text || '',
      act_name: provision.act,
      section_number: provision.section,
      section_title: provision.title,
      category: provision.category || null,
      language,
      similarity_score: Math.min(Math.max(parseFloat(provision.similarity || 0.0), 0.0), 1.0),
    }));

    res.json({
      query: q,
      language,
      results,
      total: results.length,
    });
  } catch (err) {
    next(err);
  }
});
