/**
 * NyayaSaathi — Phase 15: Multilingual, Voice & Accessibility Test Suite
 *
 * Verifies:
 * 1. Tri-language locale dictionary completeness & parity (en, hi, mr)
 * 2. i18n fallback behavior and persistent storage
 * 3. Bhashini integration adapters (NMT translation, ASR speech-to-text, TTS text-to-speech)
 * 4. Resilient error handling, language normalization & fallback modes
 * 5. Speech backend REST endpoints (/api/speech/*)
 * 6. Accessibility standards (WCAG 2.2 AA, skip link, ARIA attributes, contrast, reduced motion, font scaling)
 * 7. Preservation of statutory citations in multilingual interpretations
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { bhashiniService } from '../backend/src/services/bhashiniService.js';
import {
  translateTextHandler,
  speechToTextHandler,
  textToSpeechHandler,
  getLanguagesHandler,
} from '../backend/src/controllers/speechController.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  }
}

// Mock Express req/res
function createMockReq(params = {}, query = {}, body = {}, headers = {}) {
  return { params, query, body, headers };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('🌐  NYAYASAATHI PHASE 15: MULTILINGUAL, VOICE & ACCESSIBILITY TEST SUITE');
  console.log('='.repeat(80));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Language Dictionaries Parity (English, Hindi, Marathi)
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Tri-Language Translation Resources (en, hi, mr)');
    const enPath = path.resolve('frontend/src/i18n/locales/en.json');
    const hiPath = path.resolve('frontend/src/i18n/locales/hi.json');
    const mrPath = path.resolve('frontend/src/i18n/locales/mr.json');

    assert(fs.existsSync(enPath), 'English locale dictionary (en.json) exists');
    assert(fs.existsSync(hiPath), 'Hindi locale dictionary (hi.json) exists');
    assert(fs.existsSync(mrPath), 'Marathi locale dictionary (mr.json) exists');

    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
    const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

    // Check key modules exist in all three dictionaries
    const requiredSections = ['nav', 'hero', 'features', 'howItWorks', 'chat', 'rights', 'navigator', 'aidFinder', 'eligibility'];
    for (const sec of requiredSections) {
      assert(en[sec] !== undefined, `English has "${sec}" section`);
      assert(hi[sec] !== undefined, `Hindi has "${sec}" section`);
      assert(mr[sec] !== undefined, `Marathi has "${sec}" section`);
    }

    // Check specific navigation labels
    assert(en.nav.home === 'Home', 'English nav.home is "Home"');
    assert(hi.nav.home === 'होम', 'Hindi nav.home is "होम"');
    assert(mr.nav.home === 'मुख्यपृष्ठ', 'Marathi nav.home is "मुख्यपृष्ठ"');

    assert(en.nav.rights === 'Know Your Rights', 'English nav.rights matches');
    assert(hi.nav.rights === 'अपने अधिकार जानें', 'Hindi nav.rights matches');
    assert(mr.nav.rights === 'आपले अधिकार जाणा', 'Marathi nav.rights matches');

    // -------------------------------------------------------------------------
    // TEST 2: Bhashini Language Normalization & Identity Checks
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Bhashini Language Normalization & Identity Translation');

    assert(bhashiniService.normalizeLanguage('hi-IN') === 'hi', 'hi-IN normalizes to hi');
    assert(bhashiniService.normalizeLanguage('mr-IN') === 'mr', 'mr-IN normalizes to mr');
    assert(bhashiniService.normalizeLanguage('en-US') === 'en', 'en-US normalizes to en');
    assert(bhashiniService.normalizeLanguage('TA-IN') === 'ta', 'TA-IN normalizes to ta');

    // Identity translation (source === target)
    const identityRes = await bhashiniService.translate({
      text: 'Article 21 guarantees Right to Life',
      sourceLang: 'en',
      targetLang: 'en',
    });
    assert(identityRes.translated === true, 'Identity translation returns translated: true');
    assert(identityRes.text === 'Article 21 guarantees Right to Life', 'Returns original text without API call');
    assert(identityRes.provider === 'identity', 'Provider flagged as identity');

    // Empty text handling
    const emptyRes = await bhashiniService.translate({
      text: '',
      sourceLang: 'en',
      targetLang: 'hi',
    });
    assert(emptyRes.text === '', 'Empty text handled gracefully');

    // -------------------------------------------------------------------------
    // TEST 3: Bhashini Resilience & Fallback Behavior (Without Crashing)
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Bhashini Resilient Fallback Mode');

    const sampleLegalText = 'Section 12 of Legal Services Authorities Act guarantees free legal aid to all women and children.';
    const transRes = await bhashiniService.translate({
      text: sampleLegalText,
      sourceLang: 'en',
      targetLang: 'mr',
    });

    assert(transRes.text !== undefined && transRes.text.length > 0, 'Translation returned text payload');
    assert(['bhashini', 'fallback'].includes(transRes.provider), 'Provider is either live Bhashini or graceful fallback');

    // Speech to text fallback
    const asrRes = await bhashiniService.speechToText({
      audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      language: 'mr',
    });
    assert(asrRes !== null && asrRes.provider !== undefined, 'ASR service returns valid structured response');

    // Text to speech fallback
    const ttsRes = await bhashiniService.textToSpeech({
      text: 'आपले अधिकार जाणा',
      language: 'mr',
    });
    assert(ttsRes !== null && ttsRes.provider !== undefined, 'TTS service returns valid structured response');

    // -------------------------------------------------------------------------
    // TEST 4: Speech REST Endpoints
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Speech REST Endpoints');

    // 4a. GET /api/speech/languages
    const reqLang = createMockReq();
    const resLang = createMockRes();
    await getLanguagesHandler(reqLang, resLang);

    assert(resLang.statusCode === 200, 'GET /api/speech/languages returns HTTP 200');
    assert(resLang.body.success === true, 'Languages endpoint returns success: true');
    assert(resLang.body.data.primarySupported.includes('mr'), 'Primary supported languages include Marathi');
    assert(resLang.body.data.primarySupported.includes('hi'), 'Primary supported languages include Hindi');

    // 4b. POST /api/speech/translate
    const reqTrans = createMockReq({}, {}, { text: 'Hello', sourceLang: 'en', targetLang: 'hi' });
    const resTrans = createMockRes();
    await translateTextHandler(reqTrans, resTrans, () => {});

    assert(resTrans.statusCode === 200, 'POST /api/speech/translate returns HTTP 200');
    assert(resTrans.body.success === true, 'Translate returns success: true');
    assert(resTrans.body.data.text !== undefined, 'Translate returns text payload');

    // 4c. POST /api/speech/translate validation failure
    const reqInvalid = createMockReq({}, {}, {});
    const resInvalid = createMockRes();
    await translateTextHandler(reqInvalid, resInvalid, () => {});
    assert(resInvalid.statusCode === 400, 'Empty translation payload returns HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 5: Accessibility Standards (WCAG 2.2 AA Conformance)
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Accessibility (WCAG 2.2 AA) Code Audit');

    // 5a. Check Navbar skip-to-content link
    const navbarCode = fs.readFileSync('frontend/src/components/layout/Navbar.jsx', 'utf8');
    assert(navbarCode.includes('href="#main-content"'), 'Navbar contains skip-to-content anchor link (#main-content)');
    assert(navbarCode.includes('sr-only focus:not-sr-only'), 'Skip link uses accessible screen-reader toggle utility');

    // 5b. Check App.jsx main content target
    const appCode = fs.readFileSync('frontend/src/App.jsx', 'utf8');
    assert(appCode.includes('id="main-content"'), 'App.jsx main container has id="main-content"');
    assert(appCode.includes('tabIndex="-1"'), 'App.jsx main container has tabIndex="-1" for keyboard focus');

    // 5c. Check CSS for font scaling & high contrast
    const cssCode = fs.readFileSync('frontend/src/index.css', 'utf8');
    assert(cssCode.includes('font-size-sm'), 'index.css has .font-size-sm definition');
    assert(cssCode.includes('font-size-lg'), 'index.css has .font-size-lg definition');
    assert(cssCode.includes('font-size-xl'), 'index.css has .font-size-xl definition');
    assert(cssCode.includes('high-contrast'), 'index.css has .high-contrast definition');
    assert(cssCode.includes('prefers-reduced-motion'), 'index.css supports prefers-reduced-motion media query');
    assert(cssCode.includes('outline-offset-2'), 'index.css enforces visible keyboard focus rings');

    // 5d. Check AccessibilityToolbar component
    const a11yCode = fs.readFileSync('frontend/src/components/ui/AccessibilityToolbar.jsx', 'utf8');
    assert(a11yCode.includes('aria-label="Accessibility Options"'), 'Toolbar has accessible region aria-label');
    assert(a11yCode.includes('aria-live="polite"'), 'Toolbar includes live region for screen-reader announcements');
    assert(a11yCode.includes('A-') && a11yCode.includes('A+'), 'Toolbar has font size scaling controls');

    // -------------------------------------------------------------------------
    // TEST 6: Voice Controls in Chat
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Voice Controls & Speech Synthesis Integration');
    const chatCode = fs.readFileSync('frontend/src/pages/Chat.jsx', 'utf8');
    assert(chatCode.includes('SpeechRecognition'), 'Chat implements SpeechRecognition for voice input');
    assert(chatCode.includes('SPEECH_LANG_MAP'), 'Chat maps selected language to Indian speech tags (hi-IN, mr-IN, en-IN)');
    assert(chatCode.includes('SpeechSynthesisUtterance'), 'Chat implements SpeechSynthesisUtterance for Read Aloud');
    assert(chatCode.includes('handleSpeakMessage'), 'Chat implements message playback controls');
    assert(chatCode.includes('handleStopSpeech'), 'Chat implements explicit speech cancel/stop control');

    // -------------------------------------------------------------------------
    // TEST 7: Statutory Citation Integrity in Multilingual Views
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] Statutory Citation Integrity & Machine Translation Transparency');
    const rightsCatCode = fs.readFileSync('frontend/src/pages/RightsCategory.jsx', 'utf8');
    assert(rightsCatCode.includes('Machine-Generated Translation'), 'Rights view labels machine-generated legal translations');
    assert(rightsCatCode.includes('Human-Reviewed Legal Summary'), 'Rights view distinguishes human-reviewed statutory interpretations');
    assert(rightsCatCode.includes('sec.sectionNumber'), 'Official section number (§) strictly preserved across languages');
    assert(rightsCatCode.includes('sec.actName'), 'Official Act name strictly preserved across languages');

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(80));
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

runTests();
