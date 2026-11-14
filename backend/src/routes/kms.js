/**
 * NyayaSaathi — Legal Knowledge Management System (KMS) Routes
 *
 * Mounts endpoints at /api/kms
 */

import { Router } from 'express';
import {
  getDashboardMetrics,
  listKMSActs,
  createKMSAct,
  updateKMSAct,
  listActSections,
  createActSection,
  updateActSection,
  importBatch,
  getReviewQueue,
  handleReviewAction,
  getRevisions,
  getAuditLogs,
} from '../controllers/kmsController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Middleware: Verify Admin Access or Admin API Key
 */
function adminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === (process.env.ADMIN_API_KEY || 'nyayasaathi-admin-secret-2026')) {
    req.user = req.user || { id: 'admin-key', email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
    return next();
  }

  return optionalAuth(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      return next();
    }
    // Development mode fallback
    if (process.env.NODE_ENV === 'development') {
      req.user = req.user || { id: 'dev-admin', email: 'admin@nyayasaathi.gov.in', role: 'ADMIN' };
      return next();
    }
    return res.status(403).json({ success: false, error: 'Forbidden: Admin authorization required.' });
  });
}

// ----------------------------------------------------------------------------
// Dashboard & Audit Trails
// ----------------------------------------------------------------------------
router.get('/dashboard', getDashboardMetrics);
router.get('/audit-logs', getAuditLogs);
router.get('/revisions/:entityType/:id', getRevisions);

// ----------------------------------------------------------------------------
// Act Management
// ----------------------------------------------------------------------------
router.get('/acts', listKMSActs);
router.post('/acts', adminAuth, createKMSAct);
router.put('/acts/:id', adminAuth, updateKMSAct);

// ----------------------------------------------------------------------------
// Section Management
// ----------------------------------------------------------------------------
router.get('/acts/:id/sections', listActSections);
router.post('/acts/:id/sections', adminAuth, createActSection);
router.put('/sections/:id', adminAuth, updateActSection);

// ----------------------------------------------------------------------------
// Batch Ingestion & Import
// ----------------------------------------------------------------------------
router.post('/import', adminAuth, importBatch);

// ----------------------------------------------------------------------------
// Verification Workflow & Review Queue
// ----------------------------------------------------------------------------
router.get('/review-queue', getReviewQueue);
router.post('/review/:entityType/:id', adminAuth, handleReviewAction);

export default router;
