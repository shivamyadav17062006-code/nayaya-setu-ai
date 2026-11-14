import { Router } from 'express';
import {
  listRightCategories,
  getRightCategoryBySlug,
  searchSections,
} from '../controllers/rightsController.js';

const router = Router();

router.get('/', listRightCategories);
router.get('/search', searchSections);
router.get('/:slug', getRightCategoryBySlug);

export default router;
