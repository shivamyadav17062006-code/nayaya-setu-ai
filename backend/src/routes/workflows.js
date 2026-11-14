import { Router } from 'express';
import { listWorkflows, getWorkflowByCategory } from '../controllers/workflowController.js';

const router = Router();

router.get('/', listWorkflows);
router.get('/:category', getWorkflowByCategory);

export default router;
