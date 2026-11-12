import { Router } from 'express';
import {
  listRightCategories,
  getRightCategoryBySlug,
  searchSections,
} from '../controllers/rightsController';

const router = Router();

/**
 * GET /api/rights
 * Returns all RightCategory records with section counts.
 */
router.get('/', listRightCategories);

/**
 * GET /api/rights/search?q=<query>
 * Full-text search across LegalSection originalText and simplifiedText.
 * Must be defined BEFORE /:slug to avoid route conflict.
 */
router.get('/search', searchSections);

/**
 * GET /api/rights/:slug
 * Returns a single RightCategory with its associated sections and acts.
 */
router.get('/:slug', getRightCategoryBySlug);

export default router;
