import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from '../controllers/authController.js';

const router = Router();

// Public auth endpoints
router.post('/register', validate(registerSchema, 'body'), registerUser);
router.post('/login', validate(loginSchema, 'body'), loginUser);
router.post('/logout', logoutUser);

// Protected user profile
router.get('/me', authenticate, getCurrentUser);

export default router;
