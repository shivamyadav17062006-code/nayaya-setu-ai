import { bhashiniService } from '../services/bhashiniService.js';

// ---------------------------------------------------------------------------
// POST /api/speech/translate — Text translation
// ---------------------------------------------------------------------------
export async function translateTextHandler(req, res, next) {
  try {
    const { text, sourceLang = 'en', targetLang = 'hi' } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "text" (string) is required.',
      });
    }

    const result = await bhashiniService.translate({
      text,
      sourceLang,
      targetLang,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/speech/asr — Automatic Speech Recognition (Audio to text)
// ---------------------------------------------------------------------------
export async function speechToTextHandler(req, res, next) {
  try {
    const { audioBase64, language = 'hi', audioFormat = 'wav' } = req.body || {};

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'Field "audioBase64" is required.',
      });
    }

    const result = await bhashiniService.speechToText({
      audioBase64,
      language,
      audioFormat,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/speech/tts — Text to Speech Audio Synthesis
// ---------------------------------------------------------------------------
export async function textToSpeechHandler(req, res, next) {
  try {
    const { text, language = 'hi', gender = 'female' } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "text" is required.',
      });
    }

    const result = await bhashiniService.textToSpeech({
      text,
      language,
      gender,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/speech/languages — Supported languages & provider status
// ---------------------------------------------------------------------------
export async function getLanguagesHandler(_req, res) {
  const status = bhashiniService.getStatus();
  res.status(200).json({
    success: true,
    data: status,
  });
}
