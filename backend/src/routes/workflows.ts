import { Router } from 'express';
import { listWorkflows, getWorkflowByCategory } from '../controllers/workflowController';

const router = Router();

/**
 * GET /api/workflows
 * Returns all complaint workflows (without steps for brevity).
 */
router.get('/', listWorkflows);

/**
 * GET /api/workflows/:category
 * Returns a full workflow with all steps for a given category.
 * Category is case-insensitive (e.g. "LABOUR", "labour", "domestic_violence").
 */
router.get('/:category', getWorkflowByCategory);

export default router;
