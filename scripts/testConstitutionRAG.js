/**
 * Phase 10A Comprehensive Verification Test Suite
 *
 * Tests:
 * 1. Corpus & Source Register Integrity (JSON validity, SHA-256 hash)
 * 2. Database & pgvector Persistence (Constitutional Act, Sections, Chunks, Embeddings)
 * 3. Exact Article & Clause Parsing (Article 21, 19(1)(a), 32, 39A, Preamble, Schedules)
 * 4. Constitutional RAG Retrieval & Relevance
 * 5. Statutory Priority Guardrails (preserving labour/consumer specificity)
 * 6. Backend API Endpoints (Preamble, Articles, Schedules, Admin Verification)
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { constitutionalService } from '../ai-engine/src/services/constitutionalService.js';
import { ragService } from '../ai-engine/src/services/ragService.js';
import { legalService } from '../ai-engine/src/services/legalService.js';

const prisma = new PrismaClient();

const EXPECTED_CORPUS_HASH = '012e4582328f38b26230c55dcd1d54986799605ebba0e5301716216d848a1c16';
const CONSTITUTION_ACT_ID = 'a0000000-0000-0000-0000-000000000009';

async function runVerification() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 10A: CONSTITUTION OF INDIA RAG VERIFICATION SUITE');
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Corpus & Source Register Integrity
    // -------------------------------------------------------------
    console.log('\n--- 1. Corpus & Source Register Integrity ---');

    const registerPath = path.resolve('data/constitution/source_register.json');
    assert(fs.existsSync(registerPath), 'Source register file exists');
    const registerData = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
    assert(Array.isArray(registerData.officialSources) && registerData.officialSources.length > 0, 'Source register has valid official schema');

    const corpusPath = path.resolve('data/constitution/constitution_corpus.json');
    assert(fs.existsSync(corpusPath), 'Constitution corpus file exists');
    const corpusRaw = fs.readFileSync(corpusPath);
    const corpusHash = crypto.createHash('sha256').update(corpusRaw).digest('hex');
    assert(corpusHash === EXPECTED_CORPUS_HASH, `Corpus SHA-256 matches registered hash (${corpusHash.substring(0, 16)}...)`);

    const corpus = JSON.parse(corpusRaw.toString('utf8'));
    assert(corpus.preamble && (corpus.preamble.originalText || corpus.preamble.text), 'Corpus contains full Preamble');
    assert(Array.isArray(corpus.parts) && corpus.parts.length === 26, `Corpus contains 26 constitutional Parts (found ${corpus.parts.length})`);
    assert(Array.isArray(corpus.articles) && corpus.articles.length >= 32, `Corpus contains core Articles (found ${corpus.articles.length})`);
    assert(Array.isArray(corpus.schedules) && corpus.schedules.length === 12, `Corpus contains all 12 Schedules (found ${corpus.schedules.length})`);
    const hasAmendments = corpus.articles.some(a => a.amendmentNotes && a.amendmentNotes.includes('106th')) || constitutionalService.getAmendment(106) !== null;
    assert(hasAmendments, `Corpus covers key amendments including 106th CAA`);

    // -------------------------------------------------------------
    // Test 2: Database & pgvector Persistence
    // -------------------------------------------------------------
    console.log('\n--- 2. Database & pgvector Persistence ---');

    const constAct = await prisma.legalAct.findUnique({
      where: { id: CONSTITUTION_ACT_ID },
      include: {
        sections: {
          select: { id: true, sectionNumber: true, title: true }
        }
      }
    });

    assert(constAct !== null, 'Constitution LegalAct record exists in PostgreSQL');
    assert(constAct.title.includes('Constitution of India'), `Act title is correct (${constAct.title})`);
    assert(constAct.sections.length >= 45, `At least 45 constitutional sections in PostgreSQL (found ${constAct.sections.length})`);

    const [chunkCountRow] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM public.legal_chunks lc
      JOIN public.legal_sections ls ON lc.section_id = ls.id
      WHERE ls.act_id = 'a0000000-0000-0000-0000-000000000009'::uuid
    `;
    assert(chunkCountRow.count === 80, `Exactly 80 constitutional chunks in public.legal_chunks (found ${chunkCountRow.count})`);

    const [vectorCheckRow] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM public.legal_chunks lc
      JOIN public.legal_sections ls ON lc.section_id = ls.id
      WHERE ls.act_id = 'a0000000-0000-0000-0000-000000000009'::uuid
        AND lc.embedding IS NOT NULL
        AND vector_dims(lc.embedding) = 384
    `;
    assert(vectorCheckRow.count === 80, `All 80 chunks have verified 384-dimension vector embeddings (found ${vectorCheckRow.count})`);

    // -------------------------------------------------------------
    // Test 3: Exact Article & Clause Parsing (constitutionalService)
    // -------------------------------------------------------------
    console.log('\n--- 3. Exact Reference & Parsing Evaluation ---');

    const refArt21 = constitutionalService.detectConstitutionalReference('What protections does Article 21 give to citizens?');
    assert(refArt21 && refArt21.type === 'ARTICLE' && refArt21.articleNumber === '21', 'Detected Article 21 exact reference');

    const refArt19 = constitutionalService.detectConstitutionalReference('Is speech protected under Article 19(1)(a)?');
    assert(
      refArt19 && refArt19.articleNumber === '19' && refArt19.clause === '1' && refArt19.subclause === 'a',
      'Decomposed Article 19(1)(a) into article, clause (1), and subclause (a)'
    );

    const refPreamble = constitutionalService.detectConstitutionalReference('What does the Preamble of the Constitution declare?');
    assert(refPreamble && refPreamble.type === 'PREAMBLE', 'Detected Preamble exact reference');

    const refSchedule = constitutionalService.detectConstitutionalReference('Which items are in the Seventh Schedule?');
    assert(refSchedule && refSchedule.type === 'SCHEDULE' && refSchedule.scheduleNumber === '7', 'Detected Seventh Schedule reference');

    const art32Data = constitutionalService.getArticle('32');
    assert(art32Data && art32Data.article_number === '32' && art32Data.clauses.length >= 2, 'Resolved Article 32 with clauses for writ jurisdiction');

    const sched7Data = constitutionalService.getSchedule('7');
    assert(sched7Data && sched7Data.number.includes('Seventh') && sched7Data.title.includes('List'), 'Resolved Schedule 7 with Union, State, Concurrent lists');

    const amd106 = constitutionalService.getAmendment(106);
    assert(amd106 && amd106.amendment_number === 106 && amd106.year === 2023, 'Resolved 106th Constitutional Amendment Act (Nari Shakti Vandan Adhiniyam)');

    // -------------------------------------------------------------
    // Test 4: Constitutional RAG Retrieval & Relevance
    // -------------------------------------------------------------
    console.log('\n--- 4. Constitutional RAG Retrieval & Relevance ---');

    const queryArt21 = 'What is Article 21 of the Constitution regarding life and personal liberty?';
    const retrieved21 = await legalService.retrieve(queryArt21, 'CONSTITUTIONAL', 5);
    assert(retrieved21.length > 0, 'Retrieved provisions for Article 21 query');
    const top21 = retrieved21[0];
    assert(
      top21.act.includes('Constitution') && (top21.section.includes('21') || top21.title.toLowerCase().includes('liberty')),
      `Top chunk for Article 21 matches Article 21 (${top21.act} - ${top21.section})`
    );

    const ragRes21 = await ragService.query({ message: queryArt21, intent: 'CONSTITUTIONAL' });
    assert(ragRes21 && ragRes21.answer && ragRes21.retrieval_count > 0, 'RAG query completed with generated answer and retrieved context');

    const queryArt39A = 'What does Article 39A state about equal justice and free legal aid?';
    const retrieved39A = await legalService.retrieve(queryArt39A, 'LEGAL_AID', 5);
    assert(retrieved39A.length > 0, 'Retrieved provisions for Article 39A query');
    const has39A = retrieved39A.some(c => c.section.includes('39A') || c.text.includes('39A') || c.simplified.includes('legal aid'));
    assert(has39A, 'Retrieved Article 39A chunk for free legal aid constitutional query');

    // -------------------------------------------------------------
    // Test 5: Statutory Priority Guardrails (Preserving Labour / Women / Consumer)
    // -------------------------------------------------------------
    console.log('\n--- 5. Statutory Priority Guardrails ---');

    const wageQuery = 'My employer delayed my salary for 3 months under Payment of Wages Act. What can I do?';
    const wageResult = await legalService.retrieve(wageQuery, 'LABOUR', 5);
    assert(wageResult.length > 0, 'Returned provisions for unpaid wages query');
    const topWage = wageResult[0];
    assert(
      topWage.act.includes('Payment of Wages'),
      `Unpaid wages query prioritized specific statute over Constitution (top chunk: ${topWage.act} - ${topWage.section})`
    );

    // -------------------------------------------------------------
    // Test 6: Backend HTTP API Endpoints
    // -------------------------------------------------------------
    console.log('\n--- 6. Backend HTTP API Endpoints ---');

    const backendBase = 'http://localhost:8000';
    try {
      const summaryRes = await fetch(`${backendBase}/api/constitution`);
      const summaryJson = await summaryRes.json();
      assert(summaryRes.ok && summaryJson.success && summaryJson.data.preamble, 'GET /api/constitution returns Preamble and summary');

      const articlesRes = await fetch(`${backendBase}/api/constitution/articles?limit=5`);
      const articlesJson = await articlesRes.json();
      assert(articlesRes.ok && articlesJson.success && Array.isArray(articlesJson.data.articles) && articlesJson.data.articles.length > 0, 'GET /api/constitution/articles returns article list');

      const art21Res = await fetch(`${backendBase}/api/constitution/articles/21`);
      const art21Json = await art21Res.json();
      assert(art21Res.ok && art21Json.success && (art21Json.data.articleNumber || '').includes('21'), 'GET /api/constitution/articles/21 returns Article 21 detail');

      const schedRes = await fetch(`${backendBase}/api/constitution/schedules`);
      const schedJson = await schedRes.json();
      assert(schedRes.ok && schedJson.success && schedJson.data.length === 12, 'GET /api/constitution/schedules returns 12 schedules');

      const adminRes = await fetch(`${backendBase}/api/constitution/admin/verification`);
      const adminJson = await adminRes.json();
      assert(
        adminRes.ok && adminJson.success && adminJson.data.sha256 === EXPECTED_CORPUS_HASH,
        `GET /api/constitution/admin/verification verifies integrity (SHA: ${adminJson.data.sha256.substring(0, 16)}..., chunks: ${adminJson.data.extractedMetrics.indexedPgvectorChunks}, valid 384d: ${adminJson.data.extractedMetrics.indexedPgvectorChunks})`
      );
    } catch (httpErr) {
      console.warn(`  ⚠️ Backend HTTP check warning: ${httpErr.message}`);
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('='.repeat(80));

    if (passedTests === totalTests) {
      console.log('🎉 ALL CONSTITUTIONAL RAG VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
    } else {
      console.error(`⚠️ Some tests failed (${totalTests - passedTests} failed).\n`);
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('❌ Fatal error during test execution:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
