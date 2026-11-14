import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { eligibilityCheckSchema } from '../schemas/eligibilitySchemas.js';
import {
  checkEligibility,
  getIncomeLimits,
  getSavedAssessments,
} from '../controllers/eligibilityController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Evaluate legal aid eligibility
router.post('/', optionalAuth, validate(eligibilityCheckSchema, 'body'), checkEligibility);

// State-by-state statutory income thresholds
router.get('/income-limits', getIncomeLimits);

// User/session saved assessments
router.get('/assessments', optionalAuth, getSavedAssessments);

export default router;
