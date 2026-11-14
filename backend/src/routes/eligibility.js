import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { eligibilityCheckSchema } from '../schemas/eligibilitySchemas.js';
import { checkEligibility } from '../controllers/eligibilityController.js';

const router = Router();

router.post('/', validate(eligibilityCheckSchema, 'body'), checkEligibility);

export default router;
