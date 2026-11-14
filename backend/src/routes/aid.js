import { Router } from 'express';
import {
  getLegalAidProviders,
  getLegalAidProviderById,
  getDistrictsByState,
  checkNalsaEligibility,
} from '../controllers/aidController.js';

const router = Router();

router.get('/', getLegalAidProviders);
router.get('/districts/:state', getDistrictsByState);
router.post('/nalsa-eligibility', checkNalsaEligibility);
router.get('/:id', getLegalAidProviderById);

export default router;
