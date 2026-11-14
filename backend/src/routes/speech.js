import { Router } from 'express';
import {
  translateTextHandler,
  speechToTextHandler,
  textToSpeechHandler,
  getLanguagesHandler,
} from '../controllers/speechController.js';

const router = Router();

// Text Translation (NMT)
router.post('/translate', translateTextHandler);

// Speech to text (ASR)
router.post('/asr', speechToTextHandler);

// Text to speech (TTS)
router.post('/tts', textToSpeechHandler);

// Languages and service status
router.get('/languages', getLanguagesHandler);

export default router;
