import { legalService } from '../services/legalService.js';

export async function handleSearch(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 20);
    const language = req.query.language || 'en';

    if (!q || q.length < 2) {
      return res.status(400).json({ detail: 'Query parameter ?q= must be at least 2 characters.' });
    }

    const provisions = await legalService.semanticSearch(q, limit);

    const results = provisions.map((provision, index) => ({
      id: String(provision.chunk_id || `res_${index}`),
      section_id: provision.section_id,
      content: provision.simplified || provision.text || '',
      act_name: provision.act,
      section_number: provision.section,
      section_title: provision.title,
      category: provision.category || null,
      language,
      similarity_score: Math.min(Math.max(parseFloat(provision.similarity || 0.0), 0.0), 1.0),
      source_url: provision.source_url || null,
    }));

    res.status(200).json({
      query: q,
      language,
      results,
      total: results.length,
    });
  } catch (err) {
    next(err);
  }
}
