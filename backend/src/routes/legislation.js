import { Router } from 'express';
import {
  listActs,
  getActById,
  listRules,
  getSourceRegister,
  getVerificationQueue,
  updateVerificationStatus,
  getCoverageReport,
} from '../controllers/legislationController.js';

const router = Router();

// Discovery & Catalogue
router.get('/acts', listActs);
router.get('/acts/:id', getActById);
router.get('/rules', listRules);
router.get('/source-register', getSourceRegister);

// Verification Workflow & Governance
router.get('/verification-queue', getVerificationQueue);
router.patch('/verify/:id', updateVerificationStatus);

// Analytics & Coverage
router.get('/reports/coverage', getCoverageReport);

export default router;
