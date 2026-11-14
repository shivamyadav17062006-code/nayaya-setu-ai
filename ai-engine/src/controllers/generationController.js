import { ragService } from '../services/ragService.js';

export async function handleGeneration(req, res, next) {
  try {
    const { message, language, intent, session_id } = req.body;

    const response = await ragService.query({
      message,
      language,
      intent,
      session_id,
    });

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
