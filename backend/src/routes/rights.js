import { Router } from 'express';
import {
  listRightCategories,
  getRightCategoryBySlug,
  searchSections,
  listActs,
  getActById,
  listSections,
  getSectionById,
  listBeneficiaries,
} from '../controllers/rightsController.js';

const router = Router();

// 1. Categories
router.get('/', listRightCategories);

// 2. Search
router.get('/search', searchSections);

// 3. Acts
router.get('/acts', listActs);
router.get('/acts/:id', getActById);

// 4. Sections
router.get('/sections', listSections);
router.get('/sections/:id', getSectionById);

// 5. Beneficiaries
router.get('/beneficiaries', listBeneficiaries);

// 6. Generic Category by Slug (Must be registered last to avoid route collision)
router.get('/:slug', getRightCategoryBySlug);

export default router;
