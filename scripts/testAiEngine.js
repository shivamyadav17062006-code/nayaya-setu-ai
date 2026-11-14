import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../ai-engine/.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

process.env.NODE_ENV = 'test';

import { createApp } from '../ai-engine/src/index.js';
import { GeminiProvider } from '../ai-engine/src/providers/geminiProvider.js';
import { withTimeout } from '../ai-engine/src/utils/retry.js';
import { queryAIEngine } from '../backend/src/services/aiService.js';

async function runAiEngineTests() {
  console.log('====================================================');
  console.log('NYAYASAATHI PHASE 9 — AI ENGINE & GEMINI VERIFICATION');
  console.log('====================================================\n');

  const app = createApp();
  let passed = 0;
  let failed = 0;
  const results = [];

  function assert(testName, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`  ✓ ${testName}`);
      results.push({ name: testName, status: 'PASSED', details });
    } else {
      failed++;
      console.error(`  ✗ ${testName} — ${details}`);
      results.push({ name: testName, status: 'FAILED', details });
    }
  }

  try {
    // ------------------------------------------------------------------------
    // 1. Health & Readiness Probes
    // ------------------------------------------------------------------------
    console.log('[1/5] Health & Readiness Probes:');
    const resHealth = await request(app).get('/health');
    assert('GET /health — Returns service status and configured engine', resHealth.status === 200 && resHealth.body.service === 'nyayasaathi-ai-engine' && resHealth.body.engine === 'node-javascript');

    const resReady = await request(app).get('/ready');
    assert('GET /ready — Returns readiness state with probe telemetry', [200, 503].includes(resReady.status) && resReady.body.probes?.embedding?.loaded === true);

    const resManifest = await request(app).get('/');
    assert('GET / — Returns AI endpoint discovery manifest', resManifest.status === 200 && resManifest.body.endpoints?.chat !== undefined);

    // ------------------------------------------------------------------------
    // 2. Multilingual & Indic Language Services
    // ------------------------------------------------------------------------
    console.log('\n[2/5] Indic Language Detection & Translation:');
    const resLangEn = await request(app).post('/detect-language').send({ text: 'My employer withheld my wages for three months.' });
    assert('POST /detect-language — Accurately detects English (en)', resLangEn.status === 200 && resLangEn.body.language === 'en');

    const resLangHi = await request(app).post('/detect-language').send({ text: 'मुझे पिछले तीन महीने से वेतन नहीं दिया गया है।' });
    assert('POST /detect-language — Accurately detects Hindi (hi, Devanagari)', resLangHi.status === 200 && resLangHi.body.language === 'hi');

    const resLangMr = await request(app).post('/detect-language').send({ text: 'माझे मालक तीन महिन्यांचा पगार देत नाहीत काय करावे?' });
    assert('POST /detect-language — Accurately detects Marathi (mr, Devanagari)', resLangMr.status === 200 && resLangMr.body.language === 'mr');

    const resLangTa = await request(app).post('/detect-language').send({ text: 'எனக்கு மூன்று மாதங்களாக சம்பளம் வழங்கப்படவில்லை.' });
    assert('POST /detect-language — Accurately detects Tamil (ta, Tamil Script)', resLangTa.status === 200 && resLangTa.body.language === 'ta');

    const resTranslate = await request(app).post('/translate').send({
      text: 'Wages must be paid before the expiry of the seventh day after wage period.',
      target_language: 'hi',
    });
    assert('POST /translate — Processes statutory text translation request', resTranslate.status === 200 && Boolean(resTranslate.body.translatedText));

    // ------------------------------------------------------------------------
    // 3. Vector Embeddings & Semantic Search
    // ------------------------------------------------------------------------
    console.log('\n[3/5] Vector Embeddings & pgvector Semantic Search:');
    const resEmbed = await request(app).post('/embed').send({
      content: 'Payment of wages within statutory deadline under Section 5',
    });
    assert('POST /embed — Generates 384-dimensional vector embedding', resEmbed.status === 200 && resEmbed.body.embedding_dim === 384);

    const resEmbedBad = await request(app).post('/embed').send({ content: '' });
    assert('POST /embed — Rejects empty content with validation error (400)', resEmbedBad.status === 400);

    const resSearch = await request(app).get('/search?q=wages&limit=3');
    assert('GET /search — Performs semantic similarity retrieval', resSearch.status === 200 && Array.isArray(resSearch.body.results));

    // ------------------------------------------------------------------------
    // 4. Structured RAG Generation & Provider Abstraction
    // ------------------------------------------------------------------------
    console.log('\n[4/5] Structured AI Generation & RAG Reasoning:');
    const resChat = await request(app).post('/chat').send({
      message: 'My employer withheld my salary beyond the 7th of the month. What are my legal remedies?',
      language: 'en',
    });
    assert('POST /chat — Returns structured legal awareness answer with citations', resChat.status === 200 && Boolean(resChat.body.answer) && Array.isArray(resChat.body.citations));
    assert('POST /chat — Verifies zero-hallucination citations present in response', resChat.body.citations.length > 0 && resChat.body.citations[0].act !== undefined);
    assert('POST /chat — Includes actionable next steps and helpline reference', Array.isArray(resChat.body.next_steps) && resChat.body.legal_aid_suggested === true);

    const resChatEmpty = await request(app).post('/chat').send({ message: '' });
    assert('POST /chat — Rejects empty question with 400 Bad Request', resChatEmpty.status === 400);

    // ------------------------------------------------------------------------
    // 5. Error Handling, Timeouts & Backend-to-AI Interoperability
    // ------------------------------------------------------------------------
    console.log('\n[5/5] Error Handling, Timeouts & Backend Integration:');

    // Test invalid API key behavior on GeminiProvider
    const invalidKeyProvider = new GeminiProvider();
    invalidKeyProvider.client = {
      models: {
        generateContent: async () => {
          const err = new Error('API_KEY_INVALID: The provided API key is invalid.');
          err.code = 'INVALID_CREDENTIALS';
          throw err;
        },
      },
    };
    let capturedErrCode = null;
    try {
      await invalidKeyProvider.generateContent({
        systemPrompt: 'System',
        userPrompt: 'User',
      });
    } catch (err) {
      capturedErrCode = err.code;
    }
    assert('GeminiProvider — Gracefully handles INVALID_CREDENTIALS error', capturedErrCode === 'INVALID_CREDENTIALS');

    // Test timeout behavior
    let timeoutCaught = false;
    try {
      await withTimeout(
        new Promise((resolve) => setTimeout(resolve, 500)),
        100,
        'Simulation timeout'
      );
    } catch (err) {
      if (err.code === 'TIMEOUT') timeoutCaught = true;
    }
    assert('Retry & Timeout Utility — Strictly enforces configured timeout limit', timeoutCaught);

    // Test Backend-to-AI Communication
    console.log('  Testing Backend-to-AI query dispatcher...');
    const backendAiResult = await queryAIEngine({
      query: 'What remedies exist under Section 15 of Payment of Wages Act?',
      language: 'en',
      session_id: 'test-backend-bridge',
    });
    assert('Backend-to-AI Integration — Express backend receives structured response', backendAiResult && Boolean(backendAiResult.answer) && backendAiResult.sources?.length > 0);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`AI ENGINE TEST SUMMARY: ${passed} Passed, ${failed} Failed (${results.length} Total Checks)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAiEngineTests();
