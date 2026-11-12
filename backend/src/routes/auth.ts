import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser } from '../controllers/authController';

const router = Router();

const registerValidation = [
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('must be a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('must be a valid phone number'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('state')
    .optional()
    .isString()
    .trim(),
  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 }),
];

const loginValidation = [
  body('password')
    .isString()
    .notEmpty()
    .withMessage('password is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone('any'),
];

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    return;
  }
  next();
};

/**
 * POST /api/auth/register
 * Body: { email?, phone?, name?, state?, language?, password }
 * At least one of email or phone is required.
 */
router.post('/register', registerValidation, validate, registerUser);

/**
 * POST /api/auth/login
 * Body: { email?, phone?, password }
 */
router.post('/login', loginValidation, validate, loginUser);

export default router;
