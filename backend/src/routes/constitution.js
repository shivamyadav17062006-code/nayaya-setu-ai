import { Router } from 'express';
import {
  getOverview,
  listArticles,
  getArticleByNumber,
  listSchedules,
  getAdminVerification,
} from '../controllers/constitutionController.js';

export const constitutionRouter = Router();

// Constitution Overview & Preamble
constitutionRouter.get('/', getOverview);

// List / Search Articles
constitutionRouter.get('/articles', listArticles);

// Specific Article Detail
constitutionRouter.get('/articles/:articleNumber', getArticleByNumber);

// List 12 Schedules
constitutionRouter.get('/schedules', listSchedules);

// Administrative Verification Telemetry
constitutionRouter.get('/admin/verification', getAdminVerification);

export default constitutionRouter;
