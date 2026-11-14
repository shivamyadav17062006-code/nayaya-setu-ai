import { Router } from 'express';
import { healthRouter } from './health.js';
import { queryRouter } from './query.js';
import { embedRouter } from './embed.js';
import { languageRouter } from './language.js';
import { searchRouter } from './search.js';
import { caseLawRouter } from './caseLaw.js';

export const router = Router();

router.use(healthRouter);
router.use(queryRouter);
router.use(embedRouter);
router.use(languageRouter);
router.use(searchRouter);
router.use(caseLawRouter);

router.get('/', (_req, res) => {
  res.json({
    service: 'nyayasaathi-ai-engine',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      readiness: 'GET /ready',
      chat: 'POST /chat or POST /query or POST /generate',
      embed: 'POST /embed',
      detectLanguage: 'POST /detect-language',
      translate: 'POST /translate',
      search: 'GET /search?q=',
    },
  });
});

export default router;
