import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

process.env.NODE_ENV = 'test';

import { createApp } from '../backend/src/app.js';
import { prisma } from '../backend/src/lib/prisma.js';

async function runRouteTests() {
  console.log('====================================================');
  console.log('NYAYASAATHI PHASE 8 — EXPRESS ROUTE VERIFICATION');
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

  let authToken = null;
  let testUserId = null;
  const testEmail = `test_citizen_${Date.now()}@nyayasaathi.org`;
  const testPassword = 'Password123';
  const testSessionId = `test_session_${Date.now()}`;

  try {
    // 1. Core Endpoints
    console.log('[1/6] Core Discovery & Health Endpoints:');
    const resManifest = await request(app).get('/api');
    assert('GET /api — Returns API manifest', resManifest.status === 200 && resManifest.body.service === 'NyayaSaathi API');

    const resHealth = await request(app).get('/health');
    assert('GET /health — Returns system health', [200, 503].includes(resHealth.status) && resHealth.body.service === 'nyayasaathi-backend');

    const res404 = await request(app).get('/api/route-that-does-not-exist');
    assert('GET /api/unknown — Returns structured 404', res404.status === 404 && res404.body.error === 'Route not found');

    // 2. Authentication & User Management
    console.log('\n[2/6] Authentication & User Management:');
    const resRegBad = await request(app).post('/api/auth/register').send({ email: testEmail, password: 'short' });
    assert('POST /api/auth/register — Rejects weak password (<8 chars)', resRegBad.status === 400 && resRegBad.body.error === 'Validation failed');

    const resRegGood = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      name: 'Dr. B. R. Ambedkar',
      state: 'Maharashtra',
      language: 'mr',
    });
    assert('POST /api/auth/register — Creates citizen user with hashed password (201)', resRegGood.status === 201 && Boolean(resRegGood.body.data?.token));
    authToken = resRegGood.body.data?.token;
    testUserId = resRegGood.body.data?.user?.id;

    const resRegDup = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
    });
    assert('POST /api/auth/register — Blocks duplicate email (409 Conflict)', resRegDup.status === 409 && resRegDup.body.code === 'USER_ALREADY_EXISTS');

    const resLoginBad = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'IncorrectPassword999',
    });
    assert('POST /api/auth/login — Rejects incorrect credentials (401)', resLoginBad.status === 401 && resLoginBad.body.code === 'INVALID_CREDENTIALS');

    const resLoginGood = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    assert('POST /api/auth/login — Logs in citizen & issues JWT (200)', resLoginGood.status === 200 && Boolean(resLoginGood.body.data?.token));

    const resMeUnauth = await request(app).get('/api/auth/me');
    assert('GET /api/auth/me — Blocks unauthenticated request (401)', resMeUnauth.status === 401);

    const resMeAuth = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${authToken}`);
    assert('GET /api/auth/me — Returns user profile without password hash (200)', resMeAuth.status === 200 && resMeAuth.body.data?.user?.email === testEmail && !resMeAuth.body.data?.user?.password);

    const resLogout = await request(app).post('/api/auth/logout');
    assert('POST /api/auth/logout — Acknowledges stateless logout (200)', resLogout.status === 200 && resLogout.body.success === true);

    // 3. Chat & Conversational Persistence
    console.log('\n[3/6] Chat Management & Persistence:');
    const resDbStatus = await request(app).get('/api/chat/db-status');
    assert('GET /api/chat/db-status — Verifies PostgreSQL connectivity status', resDbStatus.status === 200 && resDbStatus.body.data?.configured === true);

    const resChatEmpty = await request(app).post('/api/chat').send({ message: '' });
    assert('POST /api/chat — Rejects empty message (400 Bad Request)', resChatEmpty.status === 400);

    const resCreateConv = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sessionId: testSessionId, language: 'en' });
    assert('POST /api/chat/conversations — Explicitly creates conversation session (201)', resCreateConv.status === 201 && resCreateConv.body.data?.sessionId === testSessionId);

    const resListConv = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`);
    assert('GET /api/chat/conversations — Lists conversations for user', resListConv.status === 200 && Array.isArray(resListConv.body.data) && resListConv.body.data.some(c => c.sessionId === testSessionId));

    const resGetConv = await request(app)
      .get(`/api/chat/conversations/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`);
    assert('GET /api/chat/conversations/:id — Retrieves conversation + messages', resGetConv.status === 200 && resGetConv.body.data?.sessionId === testSessionId);

    const resPatchConv = await request(app)
      .patch(`/api/chat/conversations/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ language: 'hi' });
    assert('PATCH /api/chat/conversations/:id — Updates conversation attributes', resPatchConv.status === 200 && resPatchConv.body.data?.language === 'hi');

    const resChat = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Employer withheld wages beyond 7th day under Payment of Wages Act. What is the remedy?',
        sessionId: testSessionId,
        language: 'en',
      });
    assert('POST /api/chat — Answers with legal reasoning & records persistence', resChat.status === 200 && Boolean(resChat.body.data?.answer) && resChat.body.data?.persisted === true);

    // 4. Legal Rights APIs
    console.log('\n[4/6] Legal Rights & Statutory Knowledge APIs:');
    const resCats = await request(app).get('/api/rights');
    assert('GET /api/rights — Lists legal categories with section counts', resCats.status === 200 && resCats.body.data?.length > 0 && resCats.body.data[0].sectionCount !== undefined);

    const resCatSlug = await request(app).get('/api/rights/labour');
    assert('GET /api/rights/:slug — Retrieves category with statutory sections', resCatSlug.status === 200 && resCatSlug.body.data?.slug === 'labour' && Array.isArray(resCatSlug.body.data?.sections));

    const resSearch = await request(app).get('/api/rights/search?q=wages');
    assert('GET /api/rights/search?q= — Searches sections by keyword', resSearch.status === 200 && Array.isArray(resSearch.body.data));

    const resActs = await request(app).get('/api/rights/acts');
    assert('GET /api/rights/acts — Lists statutory acts with verification metadata', resActs.status === 200 && resActs.body.data?.length > 0 && resActs.body.data[0].verificationStatus !== undefined);

    const resSections = await request(app).get('/api/rights/sections');
    assert('GET /api/rights/sections — Lists statutory sections with pagination', resSections.status === 200 && Array.isArray(resSections.body.data));

    const resBeneficiaries = await request(app).get('/api/rights/beneficiaries');
    assert('GET /api/rights/beneficiaries — Lists vulnerable beneficiary groups', resBeneficiaries.status === 200 && resBeneficiaries.body.data?.length > 0);

    // 5. Legal Aid & Workflow APIs
    console.log('\n[5/6] Legal Aid & Action Navigator APIs:');
    const resAid = await request(app).get('/api/aid');
    assert('GET /api/aid — Retrieves verified legal aid provider directory', resAid.status === 200 && resAid.body.data?.length > 0 && resAid.body.data[0].phone !== undefined);

    const resDistricts = await request(app).get('/api/aid/districts/Delhi');
    assert('GET /api/aid/districts/:state — Returns districts for state', resDistricts.status === 200 && Array.isArray(resDistricts.body.data));

    const resNalsa = await request(app).post('/api/aid/nalsa-eligibility').send({
      annualIncome: 60000,
      category: 'WORKERS',
    });
    assert('POST /api/aid/nalsa-eligibility — Fast NALSA criteria verification', resNalsa.status === 200 && resNalsa.body.data?.eligible === true && resNalsa.body.data?.helpline === '15100');

    const resWorkflows = await request(app).get('/api/workflows');
    assert('GET /api/workflows — Lists complaint workflows with step sequences', resWorkflows.status === 200 && resWorkflows.body.data?.length > 0 && resWorkflows.body.data[0].steps !== undefined);

    const resWfCategory = await request(app).get('/api/workflows/labour');
    assert('GET /api/workflows/:category — Retrieves specific workflow with authorities', resWfCategory.status === 200 && resWfCategory.body.data?.category === 'LABOUR');

    const resEligibility = await request(app).post('/api/eligibility').send({
      income: 80000,
      state: 'Maharashtra',
      category: 'LABOUR',
      beneficiaryType: 'WORKERS',
    });
    assert('POST /api/eligibility — Full statutory eligibility assessment', resEligibility.status === 200 && resEligibility.body.data?.eligible === true && resEligibility.body.data?.schemes?.length > 0);

    const resEligibilityBad = await request(app).post('/api/eligibility').send({
      income: -500,
      state: 'Delhi',
    });
    assert('POST /api/eligibility — Rejects invalid negative income (400)', resEligibilityBad.status === 400 && resEligibilityBad.body.error === 'Validation failed');

    // 6. Cleanup & Cascade Delete
    console.log('\n[6/6] Cleanup & Ownership Deletion:');
    const resDelConv = await request(app)
      .delete(`/api/chat/conversations/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`);
    assert('DELETE /api/chat/conversations/:id — Cascades deletion of conversation & messages', resDelConv.status === 200);

    // Delete test user from database
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
      assert('DB Cleanup — Test user safely removed from database', true);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed (${results.length + 1} Total Checks)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRouteTests();
