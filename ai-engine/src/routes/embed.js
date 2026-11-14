import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { embedSchema } from '../validators/index.js';
import { handleEmbed } from '../controllers/embeddingController.js';

export const embedRouter = Router();

embedRouter.post('/embed', validate(embedSchema), handleEmbed);

export default embedRouter;
