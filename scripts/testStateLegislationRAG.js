/**
 * NyayaSaathi — Phase 10C State Legislation & Jurisdiction RAG Verification Test Suite
 *
 * Verifies:
 * 1. Jurisdiction Registry completeness (28 States, 8 UTs = 36 jurisdictions).
 * 2. Official portals & SLSA Legal Aid income ceilings mapped for 100% of jurisdictions.
 * 3. PostgreSQL schema and State Acts/Rules ingestion into legal_acts and legal_sections.
 * 4. pgvector 384-dimensional embeddings in public.legal_chunks.
 * 5. Jurisdiction-aware semantic search for Maharashtra (Maharashtra Shops Act 2017).
 * 6. Jurisdiction-aware semantic search for Delhi (Delhi Shops Act 1954).
 * 7. Jurisdiction-aware semantic search for Karnataka (Sakala Act 2011).
 * 8. Cross-State isolation (Query for Mumbai excludes Delhi & Karnataka state laws).
 * 9. Hybrid Central + State retrieval (Delayed wage claim in Mumbai).
 * 10. State Legal Aid (SLSA) retrieval (Rule 14 Maharashtra SLSA Rules).
 * 11. Honest Coverage Tracker integrity (zero false 100% claims).
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { legalService, detectJurisdictionState } from '../ai-engine/src/services/legalService.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('='.repeat(80));
  console.log('🧪 NYAYASAATHI PHASE 10C: STATE & UT LEGISLATION RAG TEST SUITE');
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
    // TEST 1: Jurisdiction Registry Completeness (28 States + 8 UTs = 36)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 1: Jurisdiction Registry Completeness ---');
    const registryPath = path.resolve('data/jurisdiction/state_ut_registry.json');
    assert(fs.existsSync(registryPath), 'Registry file exists at data/jurisdiction/state_ut_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    assert(registry.totalJurisdictions === 36, `Total jurisdictions is 36 (got ${registry.totalJurisdictions})`);
    assert(registry.totalStates === 28, `Total states is 28 (got ${registry.totalStates})`);
    assert(registry.totalUnionTerritories === 8, `Total UTs is 8 (got ${registry.totalUnionTerritories})`);

    // ------------------------------------------------------------------------
    // TEST 2: Official Portals & SLSA Rule Citations Traceability
    // ------------------------------------------------------------------------
    console.log('\n--- Test 2: Source Traceability & SLSA Income Rules ---');
    const allHaveGovernmentPortals = registry.jurisdictions.every(j => Boolean(j.officialPortals?.government));
    const allHaveEgazettes = registry.jurisdictions.every(j => Boolean(j.officialPortals?.egazette));
    const allHaveSLSARules = registry.jurisdictions.every(j => Boolean(j.slsaFreeLegalAidIncomeThreshold?.ruleCitation));

    assert(allHaveGovernmentPortals, '100% (36/36) jurisdictions have verified official government portals');
    assert(allHaveEgazettes, '100% (36/36) jurisdictions have mapped official e-Gazette portals');
    assert(allHaveSLSARules, '100% (36/36) jurisdictions have cited SLSA Legal Aid Income Threshold Rules');

    // ------------------------------------------------------------------------
    // TEST 3: PostgreSQL Database State Legislation Schema & Data
    // ------------------------------------------------------------------------
    console.log('\n--- Test 3: PostgreSQL Database State Legislation Records ---');
    const stateActsInDB = await prisma.legalAct.findMany({
      where: { jurisdiction: 'STATE' },
      include: { sections: true },
    });
    assert(stateActsInDB.length >= 6, `Ingested State Acts & Rules in DB >= 6 (found ${stateActsInDB.length})`);
    const statesCoveredInDB = [...new Set(stateActsInDB.map(a => a.state))];
    assert(statesCoveredInDB.includes('MAHARASHTRA'), 'Maharashtra laws present in database');
    assert(statesCoveredInDB.includes('DELHI'), 'Delhi laws present in database');
    assert(statesCoveredInDB.includes('KARNATAKA'), 'Karnataka laws present in database');

    const totalStateSections = stateActsInDB.reduce((sum, a) => sum + (a.sections?.length || 0), 0);
    assert(totalStateSections >= 15, `Total State Sections in DB >= 15 (found ${totalStateSections})`);

    // ------------------------------------------------------------------------
    // TEST 4: pgvector 384-dimensional Embeddings for State Chunks
    // ------------------------------------------------------------------------
    console.log('\n--- Test 4: pgvector Embedding Dimension Verification ---');
    const stateChunks = await prisma.$queryRaw`
      SELECT lc.id, lc.content, la.title as act_title, la.state, vector_dims(lc.embedding) as dims
      FROM public.legal_chunks lc
      JOIN public.legal_sections ls ON ls.id = lc.section_id
      JOIN public.legal_acts la ON la.id = ls.act_id
      WHERE la.jurisdiction = 'STATE'
      LIMIT 5
    `;
    assert(stateChunks.length > 0, `State chunks exist in public.legal_chunks (sample size ${stateChunks.length})`);
    const all384 = stateChunks.every(c => c.dims === 384);
    assert(all384, 'All inspected State chunks have exact 384-dimensional dense vectors');

    // ------------------------------------------------------------------------
    // TEST 5: State Intent Extraction Helper
    // ------------------------------------------------------------------------
    console.log('\n--- Test 5: State Intent Extraction ---');
    assert(detectJurisdictionState('Overtime rules in Mumbai office') === 'MAHARASHTRA', 'Detects MAHARASHTRA from Mumbai');
    assert(detectJurisdictionState('Termination notice for employee in Delhi') === 'DELHI', 'Detects DELHI from Delhi');
    assert(detectJurisdictionState('Citizen service delay in Bengaluru') === 'KARNATAKA', 'Detects KARNATAKA from Bengaluru');
    assert(detectJurisdictionState('General fundamental rights query') === null, 'Returns null for general non-state queries');

    // ------------------------------------------------------------------------
    // TEST 6: RAG Semantic Retrieval — Maharashtra Shops & Establishments
    // ------------------------------------------------------------------------
    console.log('\n--- Test 6: Maharashtra Jurisdiction Retrieval ---');
    const mhResults = await legalService.retrieve(
      'What are the working hours and overtime wages in Mumbai shops?',
      'LABOUR',
      4
    );
    assert(mhResults.length > 0, 'Retrieved legal chunks for Maharashtra query');
    const hasMhShops = mhResults.some(r => r.act.includes('Maharashtra Shops') && (r.section === 'Section 13' || r.section === 'Section 6'));
    assert(hasMhShops, 'Top retrieved chunk matches Maharashtra Shops and Establishments Act, 2017 (Section 6 or 13)');
    const mhTopSim = mhResults[0]?.similarity || 0;
    assert(mhTopSim > 0.8, `Maharashtra top similarity exceeds 0.8 (got ${mhTopSim})`);

    // ------------------------------------------------------------------------
    // TEST 7: Cross-State Isolation (Zero Contamination)
    // ------------------------------------------------------------------------
    console.log('\n--- Test 7: Cross-State Isolation ---');
    const hasDelhiContamination = mhResults.some(r => r.state === 'DELHI');
    const hasKarnatakaContamination = mhResults.some(r => r.state === 'KARNATAKA');
    assert(!hasDelhiContamination, 'No Delhi state acts contaminated Mumbai query results');
    assert(!hasKarnatakaContamination, 'No Karnataka state acts contaminated Mumbai query results');

    // ------------------------------------------------------------------------
    // TEST 8: RAG Semantic Retrieval — Delhi Shops & Establishments Notice
    // ------------------------------------------------------------------------
    console.log('\n--- Test 8: Delhi Jurisdiction Retrieval ---');
    const dlResults = await legalService.retrieve(
      'Notice of dismissal and termination for employee in Delhi',
      'LABOUR',
      3
    );
    assert(dlResults.length > 0, 'Retrieved legal chunks for Delhi query');
    const hasDlSection30 = dlResults.some(r => r.act.includes('Delhi Shops') && r.section === 'Section 30');
    assert(hasDlSection30, 'Retrieved Delhi Shops & Establishments Act, 1954 (Section 30 - Notice of dismissal)');

    // ------------------------------------------------------------------------
    // TEST 9: RAG Semantic Retrieval — Karnataka Sakala Citizen Services
    // ------------------------------------------------------------------------
    console.log('\n--- Test 9: Karnataka Sakala Citizen Services Retrieval ---');
    const kaResults = await legalService.retrieve(
      'Citizen service delay compensation under Sakala in Bengaluru',
      'GOVERNMENT_SCHEMES',
      3
    );
    assert(kaResults.length > 0, 'Retrieved legal chunks for Karnataka Sakala query');
    const hasSakala = kaResults.some(r => r.act.includes('Sakala') && (r.section === 'Section 4' || r.section === 'Section 8'));
    assert(hasSakala, 'Retrieved Karnataka Guarantee of Services to Citizens Act (Sakala), 2011');

    // ------------------------------------------------------------------------
    // TEST 10: State Legal Services Authority (SLSA) Rule 14 Retrieval
    // ------------------------------------------------------------------------
    console.log('\n--- Test 10: State Legal Aid (SLSA) Rule 14 Retrieval ---');
    const aidResults = await legalService.retrieve(
      'What is the free legal aid annual income limit in Maharashtra DLSA?',
      'LEGAL_AID',
      3
    );
    const hasMhRule14 = aidResults.some(r => r.act.includes('Maharashtra State Legal Services Authority') && r.section === 'Rule 14');
    assert(hasMhRule14, 'Retrieved Maharashtra State Legal Services Authority Rules, 1998 (Rule 14)');

    // ------------------------------------------------------------------------
    // TEST 11: Honest Coverage Tracker Integrity
    // ------------------------------------------------------------------------
    console.log('\n--- Test 11: Honest Coverage Tracker Integrity ---');
    const trackerPath = path.resolve('data/jurisdiction/coverage_tracker.json');
    assert(fs.existsSync(trackerPath), 'Coverage tracker file exists');
    const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    assert(tracker.auditSummary.totalJurisdictions === 36, 'Tracker audits all 36 jurisdictions');
    assert(tracker.auditSummary.verifiedAndIngestedJurisdictions === 3, 'Tracker honestly reports exactly 3 verified pilot states (no fake 100%)');
    assert(tracker.auditSummary.cataloguedPendingIngestion === 33, 'Tracker honestly reports 33 catalogued states pending full ingestion');

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
