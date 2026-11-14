import { languageService } from '../services/languageService.js';

export async function handleDetectLanguage(req, res, next) {
  try {
    const { text } = req.body;
    const result = languageService.detect(text);
    res.status(200).json({
      language: result.code,
      name: result.name,
      confidence: result.confidence,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleTranslate(req, res, next) {
  try {
    const { text, target_language, source_language } = req.body;
    const result = await languageService.translate({
      text,
      targetLanguage: target_language,
      sourceLanguage: source_language,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
