/**
 * NyayaSaathi — State & UT Legislation Routes
 *
 * Mounts endpoints at /api/states
 */

import { Router } from 'express';
import {
  listStates,
  getStateByCode,
  getStateActs,
  getCoverageTracker,
} from '../controllers/stateLegislationController.js';

const router = Router();

// GET /api/states/coverage/tracker — Live honest coverage audit report
router.get('/coverage/tracker', getCoverageTracker);

// GET /api/states — List all 36 jurisdictions with filters and status
router.get('/', listStates);

// GET /api/states/:stateCode — State details, portals, SLSA threshold
router.get('/:stateCode', getStateByCode);

// GET /api/states/:stateCode/acts — Ingested Acts, rules, and sections for state
router.get('/:stateCode/acts', getStateActs);

export default router;
