import { Router } from 'express';
import { handleSearch } from '../controllers/searchController.js';

export const searchRouter = Router();

searchRouter.get('/search', handleSearch);

export default searchRouter;
