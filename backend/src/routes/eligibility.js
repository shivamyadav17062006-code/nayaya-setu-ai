import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { checkEligibility } from '../controllers/eligibilityController.js';

const router = Router();

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
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }
    next();
  },
  checkEligibility
);

export default router;
