import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser } from '../controllers/authController.js';

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

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);

export default router;
