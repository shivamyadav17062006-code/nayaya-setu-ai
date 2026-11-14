/**
 * NyayaSaathi — Case Law & Judicial Precedent Routes
 *
 * Mounts endpoints at /api/case-law
 */

import { Router } from 'express';
import {
  listJudgments,
  getJudgmentById,
  getJudgmentsByStatute,
  searchCaseLaw,
} from '../controllers/caseLawController.js';

const router = Router();

// GET /api/case-law — List judgments with court/precedent filters
router.get('/', listJudgments);

// POST /api/case-law/search — Semantic vector search
router.post('/search', searchCaseLaw);

// GET /api/case-law/statute/:provision — Find precedent interpreting a statute/article
router.get('/statute/:provision', getJudgmentsByStatute);

// GET /api/case-law/:id — Full case dossier
router.get('/:id', getJudgmentById);

export default router;
