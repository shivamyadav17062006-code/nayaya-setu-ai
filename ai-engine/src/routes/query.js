import { Router } from 'express';
import { ragService } from '../services/ragService.js';

export const queryRouter = Router();

queryRouter.post('/query', async (req, res, next) => {
  try {
    const { message, language, intent, session_id } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ detail: 'Message string is required.' });
    }

    const response = await ragService.query({
      message,
      language,
      intent,
      session_id,
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
});
