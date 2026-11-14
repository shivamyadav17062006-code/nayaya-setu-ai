import { Router } from 'express';
import { getLegalAidProviders } from '../controllers/aidController.js';

const router = Router();

router.get('/', getLegalAidProviders);

export default router;
