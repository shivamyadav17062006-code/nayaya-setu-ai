import { Router } from 'express';
import { caseLawService } from '../services/caseLawService.js';

export const caseLawRouter = Router();

caseLawRouter.post('/api/v1/case-law/retrieve', async (req, res, next) => {
  try {
    const { query, limit = 5, court = null, targetState = null } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }
    const results = await caseLawService.retrieveCaseLaw(query, {
      limit: parseInt(limit, 10) || 5,
      court,
      targetState,
    });
    return res.json({
      success: true,
      query,
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

export default caseLawRouter;
