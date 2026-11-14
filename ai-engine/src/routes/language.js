import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { detectLanguageSchema, translateSchema } from '../validators/index.js';
import { handleDetectLanguage, handleTranslate } from '../controllers/languageController.js';

export const languageRouter = Router();

languageRouter.post('/detect-language', validate(detectLanguageSchema), handleDetectLanguage);
languageRouter.post('/translate', validate(translateSchema), handleTranslate);

export default languageRouter;
