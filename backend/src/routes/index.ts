import { Router } from 'express';
import chatRouter from './chat';
import rightsRouter from './rights';
import aidRouter from './aid';
import workflowsRouter from './workflows';
import eligibilityRouter from './eligibility';
import authRouter from './auth';

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
