import { Router } from 'express';
import {
  listWorkflows,
  getWorkflowByCategory,
  getUserAllWorkflowProgress,
  getWorkflowProgress,
  updateWorkflowProgress,
  resetWorkflowProgress,
} from '../controllers/workflowController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// List workflows (supports ?q=, ?category=, ?jurisdiction=)
router.get('/', listWorkflows);

// User-wide workflow progress (must be before :id)
router.get('/user/all-progress', optionalAuth, getUserAllWorkflowProgress);

// Workflow progress endpoints (scoped to authenticated user or session ID)
router.get('/:id/progress', optionalAuth, getWorkflowProgress);
router.post('/:id/progress', optionalAuth, updateWorkflowProgress);
router.delete('/:id/progress', optionalAuth, resetWorkflowProgress);

// Workflow detail by ID or Category slug (must be after /:id/progress)
router.get('/:category', getWorkflowByCategory);

export default router;
