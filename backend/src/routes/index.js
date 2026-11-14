import { Router } from 'express';
import chatRouter from './chat.js';
import rightsRouter from './rights.js';
import aidRouter from './aid.js';
import workflowsRouter from './workflows.js';
import eligibilityRouter from './eligibility.js';
import authRouter from './auth.js';
import constitutionRouter from './constitution.js';
import legislationRouter from './legislation.js';
import stateLegislationRouter from './stateLegislation.js';
import caseLawRouter from './caseLaw.js';
import kmsRouter from './kms.js';
import rightsDiscoveryRouter from './rightsDiscovery.js';
import speechRouter from './speech.js';

export const router = Router();

// Mount all feature routes
router.use('/chat', chatRouter);
router.use('/rights', rightsRouter);
router.use('/rights-discovery', rightsDiscoveryRouter);
router.use('/aid', aidRouter);
router.use('/workflows', workflowsRouter);
router.use('/eligibility', eligibilityRouter);
router.use('/auth', authRouter);
router.use('/constitution', constitutionRouter);
router.use('/legislation', legislationRouter);
router.use('/states', stateLegislationRouter);
router.use('/case-law', caseLawRouter);
router.use('/kms', kmsRouter);
router.use('/speech', speechRouter);

// API discovery & manifest endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'NyayaSaathi API',
    version: '1.0.0',
    documentation: '/docs/API_REFERENCE.md',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      chat: {
        message: 'POST /api/chat',
        dbStatus: 'GET /api/chat/db-status',
        conversations: 'GET /api/chat/conversations',
        createConversation: 'POST /api/chat/conversations',
        getConversation: 'GET /api/chat/conversations/:id',
        updateConversation: 'PATCH /api/chat/conversations/:id',
        deleteConversation: 'DELETE /api/chat/conversations/:id',
        history: 'GET /api/chat/history/:sessionId',
      },
      rights: {
        categories: 'GET /api/rights',
        categoryBySlug: 'GET /api/rights/:slug',
        search: 'GET /api/rights/search?q=&limit=&page=',
        acts: 'GET /api/rights/acts',
        actById: 'GET /api/rights/acts/:id',
        sections: 'GET /api/rights/sections',
        sectionById: 'GET /api/rights/sections/:id',
        beneficiaries: 'GET /api/rights/beneficiaries',
      },
      aid: {
        providers: 'GET /api/aid?state=&type=&district=&search=',
        providerById: 'GET /api/aid/:id',
        districtsByState: 'GET /api/aid/districts/:state',
        nalsaEligibility: 'POST /api/aid/nalsa-eligibility',
      },
      workflows: {
        list: 'GET /api/workflows',
        byCategory: 'GET /api/workflows/:category',
      },
      eligibility: {
        check: 'POST /api/eligibility',
      },
      states: {
        list: 'GET /api/states?type=&coverage=&q=',
        byCode: 'GET /api/states/:stateCode',
        acts: 'GET /api/states/:stateCode/acts?documentType=',
        coverageTracker: 'GET /api/states/coverage/tracker',
      },
      caseLaw: {
        list: 'GET /api/case-law?court=&authority=&q=&limit=&page=',
        byId: 'GET /api/case-law/:id',
        byStatute: 'GET /api/case-law/statute/:provision',
        search: 'POST /api/case-law/search',
      },
      kms: {
        dashboard: 'GET /api/kms/dashboard',
        acts: 'GET /api/kms/acts',
        createAct: 'POST /api/kms/acts',
        updateAct: 'PUT /api/kms/acts/:id',
        sections: 'GET /api/kms/acts/:id/sections',
        createSection: 'POST /api/kms/acts/:id/sections',
        updateSection: 'PUT /api/kms/sections/:id',
        importBatch: 'POST /api/kms/import',
        reviewQueue: 'GET /api/kms/review-queue',
        reviewAction: 'POST /api/kms/review/:entityType/:id',
        revisions: 'GET /api/kms/revisions/:entityType/:id',
        auditLogs: 'GET /api/kms/audit-logs',
      },
    },
  });
});

export default router;
