import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { handleChat } from '../controllers/chatController.js';

const router = Router();

/**
 * POST /api/chat
 * Body: { message: string, language?: string, sessionId?: string }
 * Returns: { answer, sessionId, language, sources?, suggestedActions? }
 */
router.post(
  '/',
  [
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('message is required')
      .isLength({ max: 2000 })
      .withMessage('message must be at most 2000 characters'),
    body('language')
      .optional()
      .isString()
      .isLength({ min: 2, max: 5 })
      .withMessage('language must be a valid ISO 639-1 code (e.g. "en", "hi")'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('sessionId must be a string'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }
    next();
  },
  handleChat
);

export default router;
