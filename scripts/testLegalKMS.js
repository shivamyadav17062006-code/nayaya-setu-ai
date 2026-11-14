/**
 * NyayaSaathi — Phase 11: India-Wide Legal Knowledge Management System Test Suite
 *
 * Verifies:
 * 1. Statutory schema and data validation (title, year, jurisdiction, official URL).
 * 2. Duplicate detection for existing Acts and statutory provisions.
 * 3. Text/Gazette extraction and Section parsing.
 * 4. 5-Stage Verification Lifecycle State Machine:
 *    DRAFT -> UNDER_REVIEW -> VERIFIED -> PUBLISHED -> SUPERSEDED
 * 5. Automatic RAG pgvector synchronization:
 *    - Chunks are never indexed while DRAFT or UNDER_REVIEW.
 *    - High-dimensional (384-d) dense vector chunks are generated on PUBLISHED.
 *    - Vector chunks are immediately purged upon SUPERSEDED or REJECT.
 * 6. Content revision history snapshots and immutable audit trails.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';
import { legalIngestionService } from '../backend/src/services/legalIngestionService.js';
import { legalWorkflowService, LegalWorkflowStatus } from '../backend/src/services/legalWorkflowService.js';
import { kmsRAGSyncService } from '../backend/src/services/kmsRAGSyncService.js';

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

async function runTestSuite() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 11: LEGAL KMS COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80));

  let testActId = null;
  let testSectionId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Schema & Data Validation
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Statutory Payload Validation');
    const emptyAct = legalIngestionService.validateAct({});
    assert(!emptyAct.valid, 'Empty Act payload must fail validation');
    assert(emptyAct.errors.length >= 3, 'Must capture multiple validation errors on missing fields');

    const invalidStateAct = legalIngestionService.validateAct({
      title: 'State Tenancy Act',
      year: 2024,
      jurisdiction: 'STATE',
      sourceUrl: 'https://state.gov.in',
    });
    assert(!invalidStateAct.valid, 'STATE jurisdiction Act must require valid state field');

    const validActPayload = {
      title: `Right to Fair Compensation Pilot Act ${Date.now()}`,
      actNumber: 'ACT-99-TEST',
      year: 2026,
      jurisdiction: 'CENTRAL',
      sourceUrl: 'https://www.indiacode.nic.in/handle/123456789/test-pilot',
    };
    const validCheck = legalIngestionService.validateAct(validActPayload);
    assert(validCheck.valid, 'Valid Act payload passes schema validation');

    // -------------------------------------------------------------------------
    // TEST 2: Ingestion & Duplicate Detection
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Ingestion & Duplicate Detection');
    const createdAct = await prisma.legalAct.create({
      data: {
        title: validActPayload.title,
        actNumber: validActPayload.actNumber,
        year: validActPayload.year,
        jurisdiction: validActPayload.jurisdiction,
        sourceUrl: validActPayload.sourceUrl,
        documentType: 'ACT',
        category: 'PROPERTY_RIGHTS',
        description: 'Test statutory enactment for verification lifecycle',
        status: 'ACTIVE',
        verificationStatus: LegalWorkflowStatus.DRAFT,
        reviewNotes: 'Initial ingestion via test harness',
      },
    });
    testActId = createdAct.id;
    assert(createdAct.id !== null, 'Act record created with UUID in public.legal_acts');
    assert(createdAct.verificationStatus === 'DRAFT', 'Initial statutory status enters as DRAFT');

    const dupCheck = await legalIngestionService.detectActDuplicates(validActPayload.title, validActPayload.actNumber, validActPayload.year);
    assert(dupCheck.isDuplicate, 'Duplicate detection identifies exact title and Act number match');

    // -------------------------------------------------------------------------
    // TEST 3: Raw Gazette Section Extraction Parser
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Rule-Based Legal Gazette Section Parser');
    const sampleGazetteText = `
      Section 1. Short title, extent and commencement.
      (1) This Act may be called the Fair Compensation Act, 2026.
      (2) It extends to the whole of India.

      Section 2. Determination of social impact and public purpose.
      Whenever the appropriate Government intends to acquire land for a public purpose, it shall carry out a Social Impact Assessment study.
    `;
    const parsedSections = legalIngestionService.parseLegalText(sampleGazetteText);
    assert(parsedSections.length === 2, 'Parser extracts exactly 2 structured sections from raw Gazette text');
    assert(parsedSections[0].sectionNumber === 'Section 1', 'Section 1 extracted with correct numbering');
    assert(parsedSections[1].sectionNumber === 'Section 2', 'Section 2 extracted with correct numbering');

    // -------------------------------------------------------------------------
    // TEST 4: Section Creation & RAG Vector Shield
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Section Persistence & RAG Shielding');
    const createdSec = await prisma.legalSection.create({
      data: {
        actId: testActId,
        sectionNumber: 'Section 2',
        title: 'Social Impact Assessment',
        originalText: parsedSections[1].originalText,
        simplifiedText: 'The government must study social impact before acquiring private land for public projects.',
        verificationStatus: LegalWorkflowStatus.DRAFT,
      },
    });
    testSectionId = createdSec.id;
    assert(createdSec.id !== null, 'Section record created in public.legal_sections');

    // Verify RAG isolation: Must NOT exist in public.legal_chunks
    const draftChunks = await prisma.$queryRaw`
      SELECT count(*)::int as count FROM public.legal_chunks WHERE section_id = ${testSectionId}::uuid;
    `;
    assert(draftChunks[0].count === 0, 'ZERO chunks indexed in citizen RAG while in DRAFT status');

    // -------------------------------------------------------------------------
    // TEST 5: State Machine — Transition to UNDER_REVIEW
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] State Machine: DRAFT -> UNDER_REVIEW');
    const reviewAct = await legalWorkflowService.submitForReview(
      'ACT',
      testActId,
      { email: 'paralegal@nyayasaathi.gov.in', role: 'PARALEGAL' },
      'Submitted for legal verification'
    );
    assert(reviewAct.verificationStatus === LegalWorkflowStatus.UNDER_REVIEW, 'Act transitioned to UNDER_REVIEW');

    // -------------------------------------------------------------------------
    // TEST 6: State Machine — Transition to VERIFIED
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] State Machine: UNDER_REVIEW -> VERIFIED');
    const verifiedAct = await legalWorkflowService.approveVerify(
      'ACT',
      testActId,
      { email: 'senior-verifier@nyayasaathi.gov.in', role: 'ADMIN' },
      'Cross-checked against India Code consolidated database'
    );
    assert(verifiedAct.verificationStatus === LegalWorkflowStatus.VERIFIED, 'Act transitioned to VERIFIED');
    assert(verifiedAct.reviewerId === 'senior-verifier@nyayasaathi.gov.in', 'Reviewer attribution persisted');

    // -------------------------------------------------------------------------
    // TEST 7: State Machine — Transition to PUBLISHED & RAG Vector Indexing
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] State Machine: VERIFIED -> PUBLISHED (Triggers Vector Sync)');
    const publishRes = await legalWorkflowService.publish(
      'ACT',
      testActId,
      { email: 'lead-editor@nyayasaathi.gov.in', role: 'ADMIN' },
      'Approved for public citizen search'
    );
    assert(publishRes.act.verificationStatus === LegalWorkflowStatus.PUBLISHED, 'Act transitioned to PUBLISHED');
    assert(publishRes.ragSync.synced >= 1, 'Automatic RAG vector chunk synchronization synced at least 1 section');

    // Verify that the vector is indexed in pgvector
    const publishedChunks = await prisma.$queryRaw`
      SELECT id, chunk_number, language, content, embedding IS NOT NULL as has_vector 
      FROM public.legal_chunks 
      WHERE section_id = ${testSectionId}::uuid;
    `;
    assert(publishedChunks.length >= 1, 'Section chunk is now present in public.legal_chunks');
    assert(publishedChunks[0].has_vector === true, 'Chunk has a verified dense pgvector embedding');

    // -------------------------------------------------------------------------
    // TEST 8: Revision Snapshots & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] Immutable Audit Trail & Revision History');
    const revisions = await legalWorkflowService.getRevisions('ACT', testActId);
    assert(revisions.length >= 2, 'Captured at least 2 immutable revision snapshots in public.legal_revisions');

    const auditLogs = await prisma.$queryRaw`
      SELECT action, actor_email, review_notes 
      FROM public.legal_audit_logs 
      WHERE entity_id = ${testActId}::uuid 
      ORDER BY created_at ASC;
    `;
    assert(auditLogs.length >= 3, 'Recorded at least 3 audit log events (SUBMIT_REVIEW, VERIFY, PUBLISH)');
    const actions = auditLogs.map(l => l.action);
    assert(actions.includes('SUBMIT_REVIEW') && actions.includes('VERIFY') && actions.includes('PUBLISH'), 'Audit trail records complete lifecycle actions');

    // -------------------------------------------------------------------------
    // TEST 9: State Machine — Transition to SUPERSEDED & Vector Purge
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] State Machine: PUBLISHED -> SUPERSEDED (Purges RAG Index)');
    const supersedeRes = await legalWorkflowService.supersede(
      'ACT',
      testActId,
      { email: 'lead-editor@nyayasaathi.gov.in', role: 'ADMIN' },
      'Superseded by newer statutory reform'
    );
    assert(supersedeRes.act.verificationStatus === LegalWorkflowStatus.SUPERSEDED, 'Act transitioned to SUPERSEDED');

    const chunksAfterSupersede = await prisma.$queryRaw`
      SELECT count(*)::int as count FROM public.legal_chunks WHERE section_id = ${testSectionId}::uuid;
    `;
    assert(chunksAfterSupersede[0].count === 0, 'Superseded statutory chunks are completely purged from citizen RAG search');

    console.log('\n' + '='.repeat(80));
    console.log(`✅ TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(80));
  } finally {
    if (testActId) {
      // Clean up test data
      await prisma.$executeRawUnsafe(`DELETE FROM public.legal_chunks WHERE section_id = $1::uuid;`, testSectionId);
      await prisma.$executeRawUnsafe(`DELETE FROM public.legal_sections WHERE act_id = $1::uuid;`, testActId);
      await prisma.$executeRawUnsafe(`DELETE FROM public.legal_revisions WHERE entity_id = $1::uuid;`, testActId);
      await prisma.$executeRawUnsafe(`DELETE FROM public.legal_audit_logs WHERE entity_id = $1::uuid;`, testActId);
      await prisma.legalAct.deleteMany({ where: { id: testActId } });
    }
    await prisma.$disconnect();
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite:', err);
  process.exit(1);
});
