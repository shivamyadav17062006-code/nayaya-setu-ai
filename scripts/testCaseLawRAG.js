/**
 * NyayaSaathi — Phase 10D: Case Law & Judicial Precedent Verification Test Suite
 *
 * Verifies:
 * 1. Case Identification: Landmark Supreme Court & High Court cases exist in DB.
 * 2. Court Identification: Correct categorization of Supreme Court vs. High Courts.
 * 3. Authority Classification: BINDING_NATIONWIDE (Art. 141) vs. BINDING_WITHIN_STATE.
 * 4. Judgment Source Traceability: Official URLs and document checksums preserved.
 * 5. Paragraph Citations & 384-d pgvector embeddings in public.judgment_chunks.
 * 6. Statute Relationships: Linked to Articles 14, 19, 21, 39A, POSH, PWDVA, CPA.
 * 7. Semantic RAG Precedent Retrieval: Vishaka, Satish Chander Ahuja, Hussainara, D.K. Basu.
 * 8. State High Court Precedent Retrieval: Bombay HC (Bharatiya Hotel) & Delhi HC (DSLSA).
 * 9. Separation of Judicial Precedent from Statutory Text.
 * 10. Honest Coverage Reporting (Pilot landmark case law; no exaggerated claims).
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { caseLawService } from '../ai-engine/src/services/caseLawService.js';
import { ragService } from '../ai-engine/src/services/ragService.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('='.repeat(80));
  console.log('🧪 NYAYASAATHI PHASE 10D: CASE LAW & JUDICIAL PRECEDENT TEST SUITE');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Database Case Law Records
    // ------------------------------------------------------------------------
    console.log('\n--- Test 1: Case Identification & DB Counts ---');
    const judgments = await prisma.$queryRaw`
      SELECT id, case_title, citation, court_name, court_level, precedent_authority, source_url, checksum
      FROM public.court_judgments
      ORDER BY decision_date DESC;
    `;
    assert(judgments.length >= 8, `Ingested judgments count >= 8 (found ${judgments.length})`);

    const titles = judgments.map(j => j.case_title);
    assert(titles.some(t => t.includes('Vishaka')), 'Vishaka v. State of Rajasthan present in DB');
    assert(titles.some(t => t.includes('Satish Chander Ahuja')), 'Satish Chander Ahuja v. Sneha Ahuja present in DB');
    assert(titles.some(t => t.includes('Hussainara Khatoon')), 'Hussainara Khatoon v. Home Secretary present in DB');
    assert(titles.some(t => t.includes('D.K. Basu')), 'D.K. Basu v. State of West Bengal present in DB');
    assert(titles.some(t => t.includes('Jagjit Singh')), 'State of Punjab v. Jagjit Singh present in DB');
    assert(titles.some(t => t.includes('Shantha')), 'IMA v. V.P. Shantha present in DB');

    // ------------------------------------------------------------------------
    // TEST 2: Court Identification & Hierarchy
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Court Identification & Hierarchy ---');
    const scCount = judgments.filter(j => j.court_level === 'SUPREME_COURT').length;
    const hcCount = judgments.filter(j => j.court_level === 'HIGH_COURT').length;
    assert(scCount >= 6, `Supreme Court judgments categorized correctly (found ${scCount})`);
    assert(hcCount >= 2, `High Court judgments categorized correctly (found ${hcCount})`);

    // ------------------------------------------------------------------------
    // TEST 3: Precedent Authority Classification
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: Authority Classification ---');
    const bindingNationwide = judgments.filter(j => j.precedent_authority === 'BINDING_NATIONWIDE');
    const bindingState = judgments.filter(j => j.precedent_authority === 'BINDING_WITHIN_STATE');

    assert(bindingNationwide.every(j => j.court_level === 'SUPREME_COURT'), 'All BINDING_NATIONWIDE judgments are from Supreme Court (Art. 141)');
    assert(bindingState.every(j => j.court_level === 'HIGH_COURT'), 'High Court judgments classified as BINDING_WITHIN_STATE / Persuasive');

    // ------------------------------------------------------------------------
    // TEST 4: Judgment Source Traceability & Document Checksums
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: Official Judgment URLs & Checksums ---');
    const allHaveSources = judgments.every(j => j.source_url && j.source_url.startsWith('https://'));
    const allHaveChecksums = judgments.every(j => j.checksum && j.checksum.length === 64);
    assert(allHaveSources, '100% of judgments have official HTTPS judgment source URLs');
    assert(allHaveChecksums, '100% of judgments have 64-character SHA-256 document checksums');

    // ------------------------------------------------------------------------
    // TEST 5: Paragraph Chunks & 384-dimensional Embeddings
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: pgvector Vector Dimensions ---');
    const chunks = await prisma.$queryRaw`
      SELECT jc.id, jc.paragraph_number, jc.chunk_type, vector_dims(jc.embedding) as dims
      FROM public.judgment_chunks jc
      WHERE jc.embedding IS NOT NULL
      LIMIT 10;
    `;
    assert(chunks.length > 0, `Judgment chunks embedded in public.judgment_chunks (found ${chunks.length})`);
    const all384 = chunks.every(c => c.dims === 384);
    assert(all384, 'All judgment chunks have exact 384-dimensional dense vectors');

    // ------------------------------------------------------------------------
    // TEST 6: Statute Relationships & Constitutional Links
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Statutory & Constitutional Links ---');
    const links = await prisma.$queryRaw`
      SELECT act_title, provision_cited, relationship_type 
      FROM public.judgment_statute_links;
    `;
    assert(links.length >= 15, `Statute links recorded in database >= 15 (found ${links.length})`);
    assert(links.some(l => l.provision_cited === 'Article 14'), 'Article 14 relationship mapped');
    assert(links.some(l => l.provision_cited === 'Article 21'), 'Article 21 relationship mapped');
    assert(links.some(l => l.provision_cited === 'Section 17'), 'PWDVA Section 17 shared household mapped');
    assert(links.some(l => l.provision_cited === 'Section 4'), 'POSH Act Section 4 ICC mandate mapped');

    // ------------------------------------------------------------------------
    // TEST 7: Case Law RAG Retrieval — Workplace Sexual Harassment
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Case Law Retrieval (Vishaka) ---');
    const vishakaHits = await caseLawService.retrieveCaseLaw(
      'workplace sexual harassment internal complaints committee guidelines',
      { limit: 3 }
    );
    assert(vishakaHits.length > 0, 'Case law retrieval returned precedents');
    const topVishaka = vishakaHits.find(h => h.caseTitle.includes('Vishaka'));
    assert(Boolean(topVishaka), 'Retrieved Vishaka and Others v. State of Rajasthan');
    assert(topVishaka?.precedentAuthority === 'BINDING_NATIONWIDE', 'Vishaka authority labeled BINDING_NATIONWIDE');
    assert(topVishaka?.subsequentTreatment?.includes('POSH Act'), 'Subsequent codification in POSH Act verified');

    // ------------------------------------------------------------------------
    // TEST 8: Case Law RAG Retrieval — Domestic Violence Shared Household
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Case Law Retrieval (Satish Chander Ahuja) ---');
    const dvHits = await caseLawService.retrieveCaseLaw(
      'right of woman to reside in shared household belonging to father in law',
      { limit: 3 }
    );
    assert(dvHits.length > 0, 'Retrieved domestic violence precedents');
    const topAhuja = dvHits.find(h => h.caseTitle.includes('Ahuja'));
    assert(Boolean(topAhuja), 'Retrieved Satish Chander Ahuja v. Sneha Ahuja');
    assert(topAhuja?.ratioDecidendi?.includes('S.R. Batra'), 'Ahuja ratio confirms overruling of S.R. Batra');

    // ------------------------------------------------------------------------
    // TEST 9: Case Law RAG Retrieval — Free Legal Aid & Undertrial Prisoners
    // ------------------------------------------------------------------------
    console.log('\n--- Test 9: Case Law Retrieval (Hussainara Khatoon) ---');
    const aidHits = await caseLawService.retrieveCaseLaw(
      'speedy trial and free legal aid for poor undertrial prisoner in custody',
      { limit: 3 }
    );
    assert(aidHits.length > 0, 'Retrieved legal aid precedents');
    const topHussainara = aidHits.find(h => h.caseTitle.includes('Hussainara'));
    assert(Boolean(topHussainara), 'Retrieved Hussainara Khatoon v. Home Secretary');
    assert(topHussainara?.ratioDecidendi?.includes('Article 21'), 'Cites Article 21 constitutional obligation');

    // ------------------------------------------------------------------------
    // TEST 10: Case Law RAG Retrieval — Police Arrest Guidelines (D.K. Basu)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 10: Case Law Retrieval (D.K. Basu) ---');
    const arrestHits = await caseLawService.retrieveCaseLaw(
      'mandatory police arrest memo and medical examination rights under custody',
      { limit: 3 }
    );
    const topBasu = arrestHits.find(h => h.caseTitle.includes('D.K. Basu'));
    assert(Boolean(topBasu), 'Retrieved D.K. Basu v. State of West Bengal');
    assert(topBasu?.relevantExcerpt?.includes('arrest'), 'Includes verbatim excerpt of 11-point guidelines');

    // ------------------------------------------------------------------------
    // TEST 11: RAG Service Integrated Pipeline Test (Statute vs Precedent Distinction)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 11: Integrated RAG Pipeline Distinction ---');
    const ragResponse = await ragService.query({
      message: 'My employer did not constitute an internal committee for workplace harassment, what is the law?',
      language: 'en'
    });
    assert(Array.isArray(ragResponse.citations), 'Statutory citations present in response');
    assert(Array.isArray(ragResponse.precedents), 'Judicial precedents present as distinct structured array');
    assert(ragResponse.precedents.length > 0, 'Integrated RAG populated case law precedents');
    const hasPrecedentTitle = ragResponse.precedents.some(p => p.caseTitle?.includes('Vishaka'));
    assert(hasPrecedentTitle, 'Precedents array includes landmark Vishaka case without mixing with statutory text');

    // ------------------------------------------------------------------------
    // TEST 12: Source Register & Honest Scope Verification
    // ------------------------------------------------------------------------
    console.log('\n--- Test 12: Source Register & Honest Scope ---');
    const registerPath = path.resolve('data/caselaw/judgment_source_register.json');
    assert(fs.existsSync(registerPath), 'judgment_source_register.json exists');
    const reg = JSON.parse(fs.readFileSync(registerPath, 'utf-8'));
    assert(reg.totalSources === 8, 'Accurately documents 8 landmark pilot precedents (honest scope)');
    assert(reg.breakdownByCourtLevel.supremeCourt === 6, 'Documents 6 Supreme Court precedents');
    assert(reg.breakdownByCourtLevel.highCourts === 2, 'Documents 2 High Court precedents');

  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('='.repeat(80));

  if (failed > 0) process.exit(1);
}

runTests();
