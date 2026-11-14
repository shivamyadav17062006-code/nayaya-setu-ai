import { Router } from 'express';
import chatRouter from './chat.js';
import rightsRouter from './rights.js';
import aidRouter from './aid.js';
import workflowsRouter from './workflows.js';
import eligibilityRouter from './eligibility.js';
import authRouter from './auth.js';

export const router = Router();

// Mount all feature routes
router.use('/chat', chatRouter);
router.use('/rights', rightsRouter);
router.use('/aid', aidRouter);
router.use('/workflows', workflowsRouter);
router.use('/eligibility', eligibilityRouter);
router.use('/auth', authRouter);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'NyayaSaathi API',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      rights: 'GET /api/rights, GET /api/rights/:slug, GET /api/rights/search?q=',
      aid: 'GET /api/aid?state=&category=',
      workflows: 'GET /api/workflows, GET /api/workflows/:category',
      eligibility: 'POST /api/eligibility',
      auth: 'POST /api/auth/register, POST /api/auth/login',
    },
  });
});

export default router;
