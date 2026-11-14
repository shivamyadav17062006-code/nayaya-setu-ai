import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { querySchema } from '../validators/index.js';
import { handleGeneration } from '../controllers/generationController.js';

export const queryRouter = Router();

// Compatible across legacy and modern endpoints
queryRouter.post('/query', validate(querySchema), handleGeneration);
queryRouter.post('/chat', validate(querySchema), handleGeneration);
queryRouter.post('/generate', validate(querySchema), handleGeneration);

export default queryRouter;
