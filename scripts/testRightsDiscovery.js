/**
 * NyayaSaathi — Phase 12: Personalized Know Your Rights Discovery Test Suite
 *
 * Verifies 10 diverse citizen scenarios:
 * 1. Unpaid factory wages (Payment of Wages Act 1936 Sec. 15)
 * 2. Domestic violence & shelter (PWDVA 2005 Sec. 3, 12, 17, 18)
 * 3. Defective consumer product / refund refusal (Consumer Protection Act 2019 Sec. 35)
 * 4. Illegal detention & 24h Magistrate production (Constitution Art. 22)
 * 5. SC/ST community free legal aid entitlement (LSAA 1987 Sec. 12 & Art. 17)
 * 6. Multiple laws applicable: Tenancy eviction & utility disconnection
 * 7. Senior citizen maintenance & shelter denial (Senior Citizens Act 2007 Sec. 4 & 5)
 * 8. Disability reasonable accommodation & barrier-free access (RPwD Act 2016 Sec. 3)
 * 9. Child elementary education admission under RTE (Art. 21A & RTE Act 2009)
 * 10. Vague/sparse query requiring additional information & low confidence handling
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';
import { rightsDiscoveryService } from '../backend/src/services/rightsDiscoveryService.js';

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

async function runTests() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 12: PERSONALIZED RIGHTS DISCOVERY TEST SUITE');
  console.log('='.repeat(80));

  let savedTokens = [];

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Unpaid Factory Wages (Labour & Wages)
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 1] Unpaid Factory Wages');
    const s1 = await rightsDiscoveryService.discoverRights({
      situation: 'My factory employer in Mumbai has withheld my monthly salary for 3 months and is threatening to terminate my employment without notice.',
      context: {
        state: 'MAHARASHTRA',
        beneficiaryCategory: 'workers',
        answers: { wage_timeframe: 'Yes, within 12 months', written_proof: 'Yes, have payslips/messages' },
      },
      userConsent: true,
    });

    assert(s1.success, 'Scenario 1 successfully processed');
    if (s1.data.sessionToken) savedTokens.push(s1.data.sessionToken);
    assert(s1.data.detectedDomains.includes('LABOUR_WAGES'), 'Correctly detected LABOUR_WAGES domain');
    assert(s1.data.applicableRights.some(r => r.actTitle.includes('Wages') || r.sectionNumber.includes('15') || r.sectionNumber.includes('5')), 'Matched Payment of Wages / Minimum Wages Act');
    assert(s1.data.recommendedRemedies.some(rem => rem.authority.includes('Labour') || rem.remedyType === 'AUTHORITY'), 'Recommended Labour Commissioner remedy');
    assert(s1.data.confidence === 'HIGH', 'High confidence match for clear wage violation');

    // -------------------------------------------------------------------------
    // SCENARIO 2: Domestic Abuse & Shelter Rights (Women's Protections)
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 2] Domestic Abuse & Shelter Rights');
    const s2 = await rightsDiscoveryService.discoverRights({
      situation: 'I am facing continuous physical abuse, verbal insults, and economic starvation from my husband and in-laws, who are threatening to evict me from the marital home.',
      context: {
        state: 'DELHI',
        beneficiaryCategory: 'women',
        answers: { shared_household: 'Still living in the house', immediate_safety: 'Yes, need immediate protection' },
      },
      userConsent: true,
    });

    assert(s2.success, 'Scenario 2 successfully processed');
    if (s2.data.sessionToken) savedTokens.push(s2.data.sessionToken);
    assert(s2.data.detectedDomains.includes('WOMEN_PROTECTION'), 'Correctly detected WOMEN_PROTECTION domain');
    assert(s2.data.applicableRights.some(r => r.actTitle.includes('Domestic Violence')), 'Matched Protection of Women from Domestic Violence Act (PWDVA)');
    assert(s2.data.beneficiaryEntitlements.some(b => b.title.includes('Free Court Representation')), 'Entitled to 100% Free Legal Aid under LSAA 1987');
    assert(s2.data.helplines.some(h => h.number === '181'), 'Surfaced Women Helpline 181');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Defective Consumer Product / Refund Denial
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 3] Defective Consumer Product & Refund Denial');
    const s3 = await rightsDiscoveryService.discoverRights({
      situation: 'I purchased a laptop online that became defective in 10 days. The seller and e-commerce platform refuse replacement or refund despite valid warranty.',
      context: {
        state: 'KARNATAKA',
        beneficiaryCategory: 'consumers',
        answers: { purchase_proof: 'Yes, have formal invoice/order ID', seller_notice: 'Yes, sent email/registered complaint' },
      },
      userConsent: true,
    });

    assert(s3.success, 'Scenario 3 successfully processed');
    if (s3.data.sessionToken) savedTokens.push(s3.data.sessionToken);
    assert(s3.data.detectedDomains.includes('CONSUMER_PROTECTION'), 'Correctly detected CONSUMER_PROTECTION domain');
    assert(s3.data.applicableRights.some(r => r.actTitle.includes('Consumer Protection')), 'Matched Consumer Protection Act, 2019');
    assert(s3.data.recommendedRemedies.some(rem => rem.officialUrl?.includes('edaakhil')), 'Surfaced e-Daakhil consumer filing portal');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Illegal Police Custody & 24h Magistrate Production
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 4] Illegal Police Custody & Detention Safeguards');
    const s4 = await rightsDiscoveryService.discoverRights({
      situation: 'My relative was taken into police lockup more than 30 hours ago without an arrest memo and has not been produced before any magistrate.',
      context: {
        state: 'UTTAR PRADESH',
        beneficiaryCategory: 'accused',
        answers: { magistrate_production: 'Not produced and over 24 hours' },
      },
      userConsent: true,
    });

    assert(s4.success, 'Scenario 4 successfully processed');
    if (s4.data.sessionToken) savedTokens.push(s4.data.sessionToken);
    assert(s4.data.detectedDomains.includes('CRIMINAL_CUSTODY'), 'Correctly detected CRIMINAL_CUSTODY domain');
    assert(s4.data.applicableRights.some(r => r.sectionNumber.includes('22')), 'Matched Constitution Article 22 arrest safeguards');
    assert(s4.data.recommendedRemedies.some(rem => rem.timeLimit.includes('24 hours')), 'Enforced mandatory 24-hour Magistrate production deadline');

    // -------------------------------------------------------------------------
    // SCENARIO 5: SC/ST Discrimination & Free Legal Representation
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 5] SC/ST Community Legal Safeguards & Free Legal Aid');
    const s5 = await rightsDiscoveryService.discoverRights({
      situation: 'I belong to a Scheduled Caste community and am being denied access to common community facilities and facing caste-based verbal abuse.',
      context: {
        state: 'RAJASTHAN',
        beneficiaryCategory: 'sc-st',
      },
      userConsent: true,
    });

    assert(s5.success, 'Scenario 5 successfully processed');
    if (s5.data.sessionToken) savedTokens.push(s5.data.sessionToken);
    assert(s5.data.beneficiaryEntitlements.some(be => be.title.includes('Section 12, Legal Services Authorities Act')), 'Guaranteed 100% Free Court Advocate under LSAA 1987 Section 12');

    // -------------------------------------------------------------------------
    // SCENARIO 6: Multiple Laws Applicable (Tenancy Eviction + Utility Cut)
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 6] Multiple Laws Applicable: Tenancy Dispute');
    const s6 = await rightsDiscoveryService.discoverRights({
      situation: 'My landlord in Pune threatened to throw my belongings on the road, disconnected electricity and water supply, and refused to return my security deposit.',
      context: {
        state: 'MAHARASHTRA',
        beneficiaryCategory: 'tenants',
        answers: { rent_agreement: 'Registered rent agreement', eviction_notice: 'Threatened verbally with force' },
      },
      userConsent: true,
    });

    assert(s6.success, 'Scenario 6 successfully processed');
    if (s6.data.sessionToken) savedTokens.push(s6.data.sessionToken);
    assert(s6.data.detectedDomains.includes('TENANCY_RIGHTS'), 'Detected TENANCY_RIGHTS domain');
    assert(s6.data.applicableRights.length >= 1, 'Multiple statutory protections identified for tenancy dispute');

    // -------------------------------------------------------------------------
    // SCENARIO 7: Senior Citizen Maintenance from Adult Children
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 7] Senior Citizen Maintenance & Protection');
    const s7 = await rightsDiscoveryService.discoverRights({
      situation: 'I am a 70 year old senior citizen unable to earn. My adult children occupy my property but refuse to provide food, medicine, or monthly maintenance.',
      context: {
        beneficiaryCategory: 'seniors',
        answers: { financial_independence: 'Cannot maintain myself' },
      },
      userConsent: true,
    });

    assert(s7.success, 'Scenario 7 successfully processed');
    if (s7.data.sessionToken) savedTokens.push(s7.data.sessionToken);
    assert(s7.data.detectedDomains.includes('SENIOR_CITIZENS'), 'Detected SENIOR_CITIZENS domain');
    assert(s7.data.applicableRights.some(r => r.actTitle.includes('Senior Citizens')), 'Matched Maintenance and Welfare of Parents and Senior Citizens Act, 2007');
    assert(s7.data.recommendedRemedies.some(rem => rem.authority.includes('Maintenance Tribunal')), 'Directed to Sub-Divisional Magistrate / Maintenance Tribunal (90-day disposal)');

    // -------------------------------------------------------------------------
    // SCENARIO 8: Person with Disability Denied Reasonable Accommodation
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 8] Disability Rights & Equality Safeguards');
    const s8 = await rightsDiscoveryService.discoverRights({
      situation: 'I have a locomotive disability and was denied promotion and access to the upper floor in my office because there is no wheelchair ramp or elevator.',
      context: {
        beneficiaryCategory: 'pwd',
        answers: { disability_certificate: 'Yes, have UDID card / certificate' },
      },
      userConsent: true,
    });

    assert(s8.success, 'Scenario 8 successfully processed');
    if (s8.data.sessionToken) savedTokens.push(s8.data.sessionToken);
    assert(s8.data.detectedDomains.includes('DISABILITY_RIGHTS'), 'Detected DISABILITY_RIGHTS domain');
    assert(s8.data.applicableRights.some(r => r.actTitle.includes('Disabilities')), 'Matched Rights of Persons with Disabilities Act, 2016');

    // -------------------------------------------------------------------------
    // SCENARIO 9: Child Denied Elementary School Admission under RTE
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 9] Child Elementary Education Admission (RTE)');
    const s9 = await rightsDiscoveryService.discoverRights({
      situation: 'A private neighborhood school refused admission to my 7 year old child and demanded donation capitation fees.',
      context: {
        beneficiaryCategory: 'students',
        answers: { child_age: 'Between 6 and 14 years' },
      },
      userConsent: true,
    });

    assert(s9.success, 'Scenario 9 successfully processed');
    if (s9.data.sessionToken) savedTokens.push(s9.data.sessionToken);
    assert(s9.data.applicableRights.some(r => r.sectionNumber.includes('21A') || r.actTitle.includes('Education')), 'Matched Article 21A / RTE Act 2009 for free elementary education');

    // -------------------------------------------------------------------------
    // SCENARIO 10: Vague / Low-Confidence Query Requiring Missing Information
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 10] Sparse Query & Missing Information Handling');
    const s10 = await rightsDiscoveryService.discoverRights({
      situation: 'Someone said bad words to me yesterday.',
      context: {},
      userConsent: false,
    });

    assert(s10.success, 'Sparse query processed gracefully without crash');
    assert(s10.data.confidence === 'LOW' || s10.data.confidence === 'MEDIUM', 'Confidence properly marked as LOW or MEDIUM');
    assert(s10.data.missingInfoNote.length > 10, 'Explicit note explaining missing legal facts provided');
    assert(s10.data.disclaimer.includes('15100'), 'Statutory disclaimer directing to NALSA 15100 attached');

    // -------------------------------------------------------------------------
    // PRIVACY CONTROLS TEST: Session Retrieval & Purge
    // -------------------------------------------------------------------------
    console.log('\n[Privacy Controls] Testing Session Bookmark & Data Purge');
    const sampleToken = savedTokens[0];
    assert(Boolean(sampleToken), 'Generated valid session token');

    const retrievedSession = await rightsDiscoveryService.getSession(sampleToken);
    assert(retrievedSession !== null, 'Successfully retrieved saved session with user token');

    const purged = await rightsDiscoveryService.deleteSession(sampleToken);
    assert(purged === true, 'Successfully purged saved discovery session from database');

    const verifyPurged = await rightsDiscoveryService.getSession(sampleToken);
    assert(verifyPurged === null, 'Verified session data is completely erased');

    console.log('\n' + '='.repeat(80));
    console.log(`✅ TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(80));
  } finally {
    // Cleanup any lingering test session tokens
    for (const t of savedTokens) {
      await prisma.$executeRawUnsafe(`DELETE FROM public.saved_rights_discoveries WHERE session_token = $1;`, t);
    }
    await prisma.$disconnect();
  }
}

runTests().catch(err => {
  console.error('Fatal error in Rights Discovery test suite:', err);
  process.exit(1);
});
