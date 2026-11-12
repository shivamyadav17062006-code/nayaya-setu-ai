import { Router } from 'express';
import { getLegalAidProviders } from '../controllers/aidController';

const router = Router();

/**
 * GET /api/aid?state=<state>&category=<type>&district=<district>
 * Returns legal aid providers filtered by state, category, and/or district.
 * All query parameters are optional.
 */
router.get('/', getLegalAidProviders);

export default router;
