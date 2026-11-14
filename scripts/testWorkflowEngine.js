/**
 * NyayaSaathi — Phase 13: Legal Action Navigator & Complaint Workflow Test Suite
 *
 * Verifies:
 * 1. Database-backed workflow listing & category filtering
 * 2. Search query filtering on procedural workflows
 * 3. Workflow retrieval by UUID and category slug
 * 4. Procedural step ordering & data integrity
 * 5. Conditional branching resolution
 * 6. Document checklist state management
 * 7. User/session progress tracking (create, update, retrieve, reset)
 * 8. User vs guest session isolation
 * 9. Official portal safety verification & statutory citations
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';
import {
  listWorkflows,
  getWorkflowByCategory,
  getWorkflowProgress,
  updateWorkflowProgress,
  resetWorkflowProgress
} from '../backend/src/controllers/workflowController.js';

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
function createMockReq(params = {}, query = {}, body = {}, headers = {}, user = null) {
  return {
    params,
    query,
    body,
    headers,
    user,
  };
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
  console.log('⚖️  NYAYASAATHI PHASE 13: LEGAL ACTION NAVIGATOR VERIFICATION TEST SUITE');
  console.log('='.repeat(80));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Database Seed Verification
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Database Workflow Seeding Verification');
    const dbCount = await prisma.complaintWorkflow.count();
    console.log(`  Found ${dbCount} complaint workflows in PostgreSQL database.`);
    assert(dbCount >= 7, 'Database contains at least 7 comprehensive statutory workflows');

    const stepsCount = await prisma.complaintStep.count();
    console.log(`  Found ${stepsCount} procedural steps across workflows.`);
    assert(stepsCount >= 20, 'Database contains at least 20 detailed procedural steps');

    // -------------------------------------------------------------------------
    // TEST 2: List Workflows Controller (All & Filtered)
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Workflow Directory Listing & Category Filtering');
    const reqListAll = createMockReq();
    const resListAll = createMockRes();
    await listWorkflows(reqListAll, resListAll);

    assert(resListAll.statusCode === 200, 'listWorkflows returns HTTP 200');
    assert(resListAll.body.success === true, 'listWorkflows returns success: true');
    assert(Array.isArray(resListAll.body.data), 'listWorkflows returns data array');
    assert(resListAll.body.data.length >= 7, 'Returned all seeded workflows');

    // Filter by category: DOMESTIC_VIOLENCE
    const reqListDv = createMockReq({}, { category: 'DOMESTIC_VIOLENCE' });
    const resListDv = createMockRes();
    await listWorkflows(reqListDv, resListDv);
    assert(resListDv.body.success === true, 'Category filter DOMESTIC_VIOLENCE returns success');
    assert(resListDv.body.data.length >= 1, 'Category filter returned domestic violence workflow');
    assert(resListDv.body.data[0].category === 'DOMESTIC_VIOLENCE', 'Workflow category matched DOMESTIC_VIOLENCE');

    // Search query: "cyber"
    const reqSearch = createMockReq({}, { q: 'cyber' });
    const resSearch = createMockRes();
    await listWorkflows(reqSearch, resSearch);
    assert(resSearch.body.success === true, 'Search query returns success');
    assert(resSearch.body.data.some(w => w.title.toLowerCase().includes('cyber') || w.category === 'CYBERCRIME'), 'Search matches cybercrime workflow');

    // -------------------------------------------------------------------------
    // TEST 3: Retrieve Workflow by UUID and Slug
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Workflow Retrieval by UUID & Category Slug');
    const labourUuid = 'c0000000-0000-0000-0000-000000000001';
    const reqByUuid = createMockReq({ category: labourUuid });
    const resByUuid = createMockRes();
    await getWorkflowByCategory(reqByUuid, resByUuid, () => {});

    assert(resByUuid.statusCode === 200, 'Retrieve by UUID returns HTTP 200');
    assert(resByUuid.body.data.id === labourUuid, 'Retrieved workflow matches UUID');
    assert(resByUuid.body.data.title.includes('Unpaid Salary'), 'Title matches labour recovery');

    // Retrieve by Slug
    const reqBySlug = createMockReq({ category: 'consumer' });
    const resBySlug = createMockRes();
    await getWorkflowByCategory(reqBySlug, resBySlug, () => {});

    assert(resBySlug.statusCode === 200, 'Retrieve by slug returns HTTP 200');
    assert(resBySlug.body.data.category === 'CONSUMER', 'Retrieved workflow matches CONSUMER category');

    // -------------------------------------------------------------------------
    // TEST 4: Verification of Data Model & Procedural Fields
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Data Model & Statutory Verification Fields');
    const wf = resByUuid.body.data;

    assert(Array.isArray(wf.eligibilityConditions) && wf.eligibilityConditions.length > 0, 'Workflow contains eligibility conditions');
    assert(Array.isArray(wf.applicableLaws) && wf.applicableLaws.length > 0, 'Workflow contains applicable statutory enactments');
    assert(Array.isArray(wf.requiredDocuments) && wf.requiredDocuments.length > 0, 'Workflow contains required documents pre-checklist');
    assert(typeof wf.verifiedTimelines === 'string' && wf.verifiedTimelines.length > 0, 'Workflow contains verified statutory timelines');
    assert(typeof wf.fees === 'string' && wf.fees.length > 0, 'Workflow contains statutory fee details');
    assert(typeof wf.escalationRoute === 'string' && wf.escalationRoute.length > 0, 'Workflow contains escalation hierarchy');
    assert(typeof wf.appealMechanism === 'string' && wf.appealMechanism.length > 0, 'Workflow contains appeal mechanism');
    assert(wf.verificationStatus === 'VERIFIED', 'Workflow is marked as VERIFIED');

    // -------------------------------------------------------------------------
    // TEST 5: Step Ordering, Tips & Conditional Branching
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Step Ordering, Tips & Conditional Branching');
    const steps = wf.steps;
    assert(steps.length >= 4, 'Labour workflow contains 4 sequential steps');
    for (let i = 0; i < steps.length; i++) {
      assert(steps[i].stepNumber === i + 1, `Step ${i + 1} has correct sequential stepNumber`);
      assert(steps[i].title && steps[i].title.length > 0, `Step ${i + 1} has valid title`);
      assert(steps[i].authorityName && steps[i].authorityName.length > 0, `Step ${i + 1} specifies target authority`);
      assert(Array.isArray(steps[i].requiredDocuments), `Step ${i + 1} has required documents array`);
    }

    // Check step with conditional branch
    const branchStep = steps.find(s => s.conditionalBranch !== null && s.conditionalBranch !== undefined);
    assert(branchStep !== undefined, 'Found a step with conditional branching logic');
    assert(typeof branchStep.conditionalBranch.question === 'string', 'Branch step has a decision question');
    assert(Array.isArray(branchStep.conditionalBranch.options) && branchStep.conditionalBranch.options.length >= 2, 'Branch step has at least 2 options');
    console.log(`  Conditional question verified: "${branchStep.conditionalBranch.question}"`);

    // -------------------------------------------------------------------------
    // TEST 6: User / Session Progress Engine (Create, Update, Fetch)
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] User / Session Progress Tracking Engine');
    const testSessionId = 'test_sess_' + Date.now();

    // 6a. Update progress
    const reqSaveProgress = createMockReq(
      { id: labourUuid },
      {},
      {
        currentStep: 2,
        completedSteps: [1],
        checkedDocuments: ['Appointment Letter / ID card', 'Bank Statement'],
        branchChoices: { '2': 'Yes, full settlement received' },
        notes: 'Sent formal registered demand letter on Monday',
        isCompleted: false,
      },
      { 'x-session-id': testSessionId }
    );
    const resSaveProgress = createMockRes();
    await updateWorkflowProgress(reqSaveProgress, resSaveProgress, () => {});

    assert(resSaveProgress.statusCode === 200, 'updateWorkflowProgress returns HTTP 200');
    assert(resSaveProgress.body.success === true, 'updateWorkflowProgress returns success: true');
    assert(resSaveProgress.body.data.currentStep === 2, 'Saved currentStep matches 2');
    assert(resSaveProgress.body.data.completedSteps.includes(1), 'Saved completedSteps contains step 1');
    assert(resSaveProgress.body.data.checkedDocuments.includes('Bank Statement'), 'Saved checkedDocuments contains Bank Statement');

    // 6b. Retrieve progress
    const reqGetProgress = createMockReq(
      { id: labourUuid },
      {},
      {},
      { 'x-session-id': testSessionId }
    );
    const resGetProgress = createMockRes();
    await getWorkflowProgress(reqGetProgress, resGetProgress, () => {});

    assert(resGetProgress.statusCode === 200, 'getWorkflowProgress returns HTTP 200');
    assert(resGetProgress.body.data !== null, 'Progress data retrieved successfully');
    assert(resGetProgress.body.data.currentStep === 2, 'Retrieved currentStep is 2');
    assert(resGetProgress.body.data.notes.includes('demand letter'), 'Retrieved notes match');

    // 6c. Complete all steps
    const reqCompleteProgress = createMockReq(
      { id: labourUuid },
      {},
      {
        currentStep: 4,
        completedSteps: [1, 2, 3, 4],
        checkedDocuments: ['Appointment Letter / ID card', 'Bank Statement', 'Demand Notice Copy'],
        isCompleted: true,
      },
      { 'x-session-id': testSessionId }
    );
    const resCompleteProgress = createMockRes();
    await updateWorkflowProgress(reqCompleteProgress, resCompleteProgress, () => {});

    assert(resCompleteProgress.body.data.isCompleted === true, 'Workflow successfully marked as completed');
    assert(resCompleteProgress.body.data.completedSteps.length === 4, 'All 4 steps recorded as completed');

    // -------------------------------------------------------------------------
    // TEST 7: Session Isolation & Security
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] Session Progress Isolation & Boundary Security');
    const isolatedSessionId = 'isolated_sess_' + Date.now();
    const reqIsolated = createMockReq(
      { id: labourUuid },
      {},
      {},
      { 'x-session-id': isolatedSessionId }
    );
    const resIsolated = createMockRes();
    await getWorkflowProgress(reqIsolated, resIsolated, () => {});

    assert(resIsolated.body.data === null, 'Different session ID cannot read another session\'s progress (returns null)');

    // -------------------------------------------------------------------------
    // TEST 8: Reset Workflow Progress
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] Reset Workflow Progress');
    const reqReset = createMockReq(
      { id: labourUuid },
      {},
      {},
      { 'x-session-id': testSessionId }
    );
    const resReset = createMockRes();
    await resetWorkflowProgress(reqReset, resReset, () => {});

    assert(resReset.statusCode === 200, 'resetWorkflowProgress returns HTTP 200');
    assert(resReset.body.success === true, 'resetWorkflowProgress returns success: true');

    // Verify it is gone
    const resCheckReset = createMockRes();
    await getWorkflowProgress(reqGetProgress, resCheckReset, () => {});
    assert(resCheckReset.body.data === null, 'Progress record deleted; returns null after reset');

    // -------------------------------------------------------------------------
    // TEST 9: Official Portal Links & Safety Checks
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] Official Portal Links & Statutory Authority Integrity');
    const allWorkflows = resListAll.body.data;
    const officialDomains = [
      'gov.in',
      'nic.in'
    ];

    for (const w of allWorkflows) {
      if (w.officialUrl) {
        const isOfficial = officialDomains.some(d => w.officialUrl.includes(d));
        assert(isOfficial, `Workflow "${w.title}" officialUrl (${w.officialUrl}) is a verified government domain (.gov.in / .nic.in)`);
      }
      for (const s of w.steps) {
        if (s.officialLink) {
          const isOfficial = officialDomains.some(d => s.officialLink.includes(d));
          assert(isOfficial, `Step "${s.title}" officialLink (${s.officialLink}) is a verified government domain (.gov.in / .nic.in)`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(80));
  } catch (err) {
    console.error('\n❌ Test suite execution halted due to error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
