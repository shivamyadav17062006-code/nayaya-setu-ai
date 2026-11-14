/**
 * NyayaSaathi — Personalized Know Your Rights Discovery Routes
 */

import { Router } from 'express';
import {
  getDiscoveryMetadata,
  classifySituationAndFollowUps,
  discoverRights,
  getSavedSession,
  deleteSavedSession,
} from '../controllers/rightsDiscoveryController.js';

export const router = Router();

// 1. Wizard Metadata (States, Beneficiaries, Categories)
router.get('/metadata', getDiscoveryMetadata);

// 2. Situation Classification & Dynamic Follow-Ups
router.post('/classify', classifySituationAndFollowUps);

// 3. Full Rights & Remedy Discovery
router.post('/discover', discoverRights);

// 4. Session Privacy Controls (Retrieve & Purge)
router.get('/session/:token', getSavedSession);
router.delete('/session/:token', deleteSavedSession);

export default router;
