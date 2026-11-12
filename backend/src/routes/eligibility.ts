import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { checkEligibility } from '../controllers/eligibilityController';

const router = Router();

/**
 * POST /api/eligibility
 * Body: { income, state, category, beneficiaryType, age? }
 * Returns eligibility result for NALSA legal aid and applicable schemes.
 */
router.post(
  '/',
  [
    body('income')
      .isNumeric()
      .withMessage('income must be a number (annual income in INR)')
      .custom((v) => v >= 0)
      .withMessage('income cannot be negative'),
    body('state')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('state is required'),
    body('category')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('category is required (e.g. LABOUR, WOMEN, GENERAL)'),
    body('beneficiaryType')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('beneficiaryType is required (e.g. SC_ST, WOMEN, CHILD, GENERAL)'),
    body('age')
      .optional()
      .isInt({ min: 0, max: 150 })
      .withMessage('age must be an integer between 0 and 150'),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      return;
    }
    next();
  },
  checkEligibility
);

export default router;
