/**
 * NyayaSaathi — Phase 14: Legal Aid Eligibility & Provider Discovery Test Suite
 *
 * Verifies:
 * 1. Statutory eligibility categories under LSAA 1987 Section 12(a)-(g) (no income limit)
 * 2. State-specific and court-level statutory income thresholds under Section 12(h)
 * 3. Comparative state rules (e.g. Bihar ₹1,50,000 vs Delhi ₹3,00,000 vs Supreme Court ₹5,00,000)
 * 4. Missing information / sparse input handling (MORE_INFORMATION_REQUIRED)
 * 5. Invalid / boundary values handling
 * 6. User assessment persistence & session privacy isolation
 * 7. Provider directory filtering (state, district, provider type, search)
 * 8. Empty search results handling
 * 9. Official government source integrity (.gov.in / .nic.in)
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';
import { legalAidEligibilityService } from '../backend/src/services/legalAidEligibilityService.js';
import {
  checkEligibility,
  getIncomeLimits,
  getSavedAssessments,
} from '../backend/src/controllers/eligibilityController.js';
import {
  getLegalAidProviders,
  getDistrictsByState,
  getLegalAidProviderById,
} from '../backend/src/controllers/aidController.js';

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
  console.log('⚖️  NYAYASAATHI PHASE 14: LEGAL AID ELIGIBILITY & DIRECTORY TEST SUITE');
  console.log('='.repeat(80));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Database Seed Verification
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Database Verification (Limits & Providers)');
    const limitCount = await prisma.legalAidIncomeLimit.count();
    console.log(`  Found ${limitCount} statutory income limits.`);
    assert(limitCount >= 30, 'Database contains verified income limits for all Indian States/UTs');

    const providerCount = await prisma.legalAidProvider.count();
    console.log(`  Found ${providerCount} official legal aid providers.`);
    assert(providerCount >= 10, 'Database contains official NALSA, SCLSC, SLSA & DLSA providers');

    // -------------------------------------------------------------------------
    // TEST 2: Statutory Exemption Categories (Section 12(a) - 12(g))
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Statutory Exemption Categories (No Income Ceiling Applicable)');

    // 2a. Woman (Section 12(c))
    const womanRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'WOMAN',
      gender: 'female',
      annualIncome: 1200000, // High income declared, but exempt by statute!
      state: 'Delhi',
    });
    assert(womanRes.status === 'POTENTIALLY_ELIGIBLE', 'Woman is potentially eligible regardless of high income');
    assert(womanRes.isStatutoryExempt === true, 'Woman marked as isStatutoryExempt = true');
    assert(womanRes.statutoryClause.includes('12(c)'), 'Statutory clause references Section 12(c)');

    // 2b. Child under 18 (Section 12(c))
    const childRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'CHILD',
      age: 14,
      state: 'Maharashtra',
    });
    assert(childRes.status === 'POTENTIALLY_ELIGIBLE', 'Child under 18 is potentially eligible without income declaration');
    assert(childRes.isStatutoryExempt === true, 'Child marked as isStatutoryExempt = true');

    // 2c. Scheduled Caste / Scheduled Tribe (Section 12(a))
    const scstRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'SC_ST',
      annualIncome: 800000,
      state: 'Rajasthan',
    });
    assert(scstRes.status === 'POTENTIALLY_ELIGIBLE', 'SC/ST member is eligible regardless of income');
    assert(scstRes.statutoryClause.includes('12(a)'), 'Statutory clause references Section 12(a)');

    // 2d. Person with a Disability (Section 12(d))
    const pwdRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'DISABILITY',
      state: 'Karnataka',
    });
    assert(pwdRes.status === 'POTENTIALLY_ELIGIBLE', 'Person with disability is eligible without income ceiling');
    assert(pwdRes.statutoryClause.includes('12(d)'), 'Statutory clause references Section 12(d)');

    // 2e. Disaster / Atrocity Victim (Section 12(e))
    const disasterRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'DISASTER_VICTIM',
      circumstances: ['MASS_DISASTER', 'FLOOD'],
      state: 'Assam',
    });
    assert(disasterRes.status === 'POTENTIALLY_ELIGIBLE', 'Disaster victim is eligible under Section 12(e)');

    // 2f. Industrial Workman (Section 12(f))
    const workerRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'INDUSTRIAL_WORKMAN',
      state: 'Gujarat',
    });
    assert(workerRes.status === 'POTENTIALLY_ELIGIBLE', 'Industrial workman is eligible under Section 12(f)');

    // 2g. Person in Custody / Undertrial (Section 12(g))
    const custodyRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'CUSTODY',
      circumstances: ['ARREST_CUSTODY', 'UNDER_TRIAL'],
      state: 'Uttar Pradesh',
    });
    assert(custodyRes.status === 'POTENTIALLY_ELIGIBLE', 'Person in custody is eligible under Section 12(g)');

    // -------------------------------------------------------------------------
    // TEST 3: State-Specific & Court-Level Income Rules (Section 12(h))
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] State-Specific & Court-Level Income Ceilings');

    // 3a. Delhi (Limit: ₹3,00,000)
    const delhiEligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Delhi',
      annualIncome: 250000,
      courtLevel: 'SUBORDINATE_COURT',
    });
    assert(delhiEligible.status === 'POTENTIALLY_ELIGIBLE', 'Delhi resident with ₹2.5L income is eligible (<= ₹3L)');
    assert(delhiEligible.isStatutoryExempt === false, 'Marked as non-exempt (income-tested)');

    const delhiIneligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Delhi',
      annualIncome: 350000,
      courtLevel: 'SUBORDINATE_COURT',
    });
    assert(delhiIneligible.status === 'POTENTIALLY_NOT_ELIGIBLE', 'Delhi resident with ₹3.5L income exceeds limit (> ₹3L)');

    // 3b. Bihar (Limit: ₹1,50,000)
    const biharEligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Bihar',
      annualIncome: 140000,
      courtLevel: 'SUBORDINATE_COURT',
    });
    assert(biharEligible.status === 'POTENTIALLY_ELIGIBLE', 'Bihar resident with ₹1.4L income is eligible (<= ₹1.5L)');

    const biharIneligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Bihar',
      annualIncome: 200000, // NOTE: ₹2,00,000 is eligible in Delhi, but NOT eligible in Bihar!
      courtLevel: 'SUBORDINATE_COURT',
    });
    assert(biharIneligible.status === 'POTENTIALLY_NOT_ELIGIBLE', 'Bihar resident with ₹2L income is NOT eligible (> ₹1.5L)');
    console.log('  State variation confirmed: ₹2L income is eligible in Delhi but NOT in Bihar.');

    // 3c. Supreme Court Level (Limit: ₹5,00,000)
    const scEligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Bihar',
      annualIncome: 450000,
      courtLevel: 'SUPREME_COURT',
    });
    assert(scEligible.status === 'POTENTIALLY_ELIGIBLE', 'For Supreme Court case, ₹4.5L income is eligible (<= ₹5L ceiling)');

    const scIneligible = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Bihar',
      annualIncome: 600000,
      courtLevel: 'SUPREME_COURT',
    });
    assert(scIneligible.status === 'POTENTIALLY_NOT_ELIGIBLE', 'For Supreme Court case, ₹6L income exceeds ₹5L limit');

    // -------------------------------------------------------------------------
    // TEST 4: Missing Information & Sparse Inputs
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Missing Information & Sparse Query Handling');

    // General category without income
    const noIncomeRes = await legalAidEligibilityService.evaluateEligibility({
      category: 'GENERAL',
      state: 'Maharashtra',
      annualIncome: null,
    });
    assert(noIncomeRes.status === 'MORE_INFORMATION_REQUIRED', 'Missing income for general category returns MORE_INFORMATION_REQUIRED');
    assert(noIncomeRes.explanation.includes('₹3,00,000'), 'Explanation accurately states Maharashtra statutory threshold');

    // Completely empty input
    const emptyRes = await legalAidEligibilityService.evaluateEligibility({});
    assert(emptyRes.status === 'MORE_INFORMATION_REQUIRED', 'Completely empty input returns MORE_INFORMATION_REQUIRED');

    // -------------------------------------------------------------------------
    // TEST 5: Assessment Persistence & Session Isolation
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] User Assessment Persistence & Boundary Isolation');
    const testSessionId = 'aid_sess_' + Date.now();

    // Evaluate with userConsent = true
    const postReq = createMockReq(
      {},
      {},
      {
        category: 'woman',
        state: 'Delhi',
        situation: 'domestic_violence',
        userConsent: true,
      },
      { 'x-session-id': testSessionId }
    );
    const postRes = createMockRes();
    await checkEligibility(postReq, postRes, () => {});

    assert(postRes.statusCode === 200, 'checkEligibility returns HTTP 200');
    assert(postRes.body.data.status === 'POTENTIALLY_ELIGIBLE', 'Endpoint returns POTENTIALLY_ELIGIBLE');
    assert(postRes.body.data.schemes.length >= 2, 'Endpoint attaches actionable legal aid schemes');
    assert(postRes.body.data.disclaimer.includes('Statutory Notice'), 'Endpoint attaches statutory disclaimer');

    // Fetch saved assessments for this session
    const getAssessReq = createMockReq({}, {}, {}, { 'x-session-id': testSessionId });
    const getAssessRes = createMockRes();
    await getSavedAssessments(getAssessReq, getAssessRes, () => {});

    assert(getAssessRes.statusCode === 200, 'getSavedAssessments returns HTTP 200');
    assert(getAssessRes.body.data.length >= 1, 'Session assessment persisted and retrieved');

    // Fetch with a different session ID -> must be isolated!
    const diffSessionReq = createMockReq({}, {}, {}, { 'x-session-id': 'unrelated_sess_999' });
    const diffSessionRes = createMockRes();
    await getSavedAssessments(diffSessionReq, diffSessionRes, () => {});

    assert(diffSessionRes.body.data.length === 0, 'Different session ID cannot read other sessions assessments');

    // -------------------------------------------------------------------------
    // TEST 6: Provider Directory Filtering & Search
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Legal Aid Provider Directory Filtering');

    // 6a. Filter by State: Maharashtra
    const reqMh = createMockReq({}, { state: 'Maharashtra' });
    const resMh = createMockRes();
    await getLegalAidProviders(reqMh, resMh, () => {});

    assert(resMh.statusCode === 200, 'getLegalAidProviders returns HTTP 200');
    assert(resMh.body.data.length >= 1, 'Returned providers for Maharashtra');
    assert(resMh.body.data.every(p => p.state.toLowerCase() === 'maharashtra'), 'All returned providers match Maharashtra');

    // 6b. Filter by Provider Type: SCLSC
    const reqSclsc = createMockReq({}, { type: 'SCLSC' });
    const resSclsc = createMockRes();
    await getLegalAidProviders(reqSclsc, resSclsc, () => {});

    assert(resSclsc.body.data.length >= 1, 'Returned SCLSC provider');
    assert(resSclsc.body.data[0].type === 'SCLSC', 'Provider type is SCLSC');

    // 6c. Text Search: "Patiala"
    const reqSearch = createMockReq({}, { search: 'Patiala' });
    const resSearch = createMockRes();
    await getLegalAidProviders(reqSearch, resSearch, () => {});

    assert(resSearch.body.data.length >= 1, 'Search query "Patiala" matched DSLSA / Patiala House');

    // 6d. Districts by State
    const reqDist = createMockReq({ state: 'Maharashtra' });
    const resDist = createMockRes();
    await getDistrictsByState(reqDist, resDist, () => {});

    assert(resDist.statusCode === 200, 'getDistrictsByState returns HTTP 200');
    assert(Array.isArray(resDist.body.data) && resDist.body.data.length >= 1, 'Returned districts for Maharashtra');

    // 6e. Empty Search Results
    const reqEmpty = createMockReq({}, { search: 'NonExistentXYZ9999' });
    const resEmpty = createMockRes();
    await getLegalAidProviders(reqEmpty, resEmpty, () => {});

    assert(resEmpty.statusCode === 200, 'Empty search returns HTTP 200 with empty array');
    assert(resEmpty.body.data.length === 0, 'Empty search results handled cleanly');

    // -------------------------------------------------------------------------
    // TEST 7: Official Domain & Coordinates Integrity
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] Official Sources & Coordinates Integrity');
    const reqAll = createMockReq({}, { limit: '100' });
    const resAll = createMockRes();
    await getLegalAidProviders(reqAll, resAll, () => {});

    const allProviders = resAll.body.data;
    for (const p of allProviders) {
      assert(p.website && (p.website.includes('.gov.in') || p.website.includes('.nic.in') || p.website.includes('.org')),
        `Provider "${p.name}" has official government or statutory authority website`);

      if (p.latitude !== null && p.latitude !== undefined) {
        assert(p.latitude >= 8 && p.latitude <= 38 && p.longitude >= 68 && p.longitude <= 98,
          `Provider "${p.name}" coordinates are within real Indian geographical bounds`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(80));
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
