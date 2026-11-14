import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set test environment
process.env.NODE_ENV = 'test';

import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe('NyayaSaathi Complete Express Backend API Test Suite', () => {
  let app;
  let authToken;
  let testUserId;
  let testSessionId;
  let testConversationId;

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    // Clean up test records
    try {
      if (testUserId) {
        await prisma.conversation.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
      }
    } catch {
      // Ignore cleanup error if already removed
    }
    await prisma.$disconnect();
  });

  // --------------------------------------------------------------------------
  // 1. Core Health & Discovery
  // --------------------------------------------------------------------------
  describe('System & Discovery Endpoints', () => {
    test('GET /api — API discovery manifest', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toBe('NyayaSaathi API');
      expect(res.body.endpoints).toBeDefined();
    });

    test('GET /health — Service health check', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body.service).toBe('nyayasaathi-backend');
      expect(res.body.dependencies).toBeDefined();
    });

    test('GET /unknown-route — 404 handler', async () => {
      const res = await request(app).get('/api/unknown-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Route not found');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Authentication & Users
  // --------------------------------------------------------------------------
  describe('Authentication & User Management', () => {
    const uniqueEmail = `citizen_test_${Date.now()}@nyayasaathi.org`;
    const validPassword = 'SecurePassword123';

    test('POST /api/auth/register — Validation error on invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail, password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    test('POST /api/auth/register — Successfully registers a citizen', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: validPassword,
          name: 'Priya Sharma',
          state: 'Maharashtra',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.user.name).toBe('Priya Sharma');
      expect(res.body.data.user.password).toBeUndefined(); // never expose password

      authToken = res.body.data.token;
      testUserId = res.body.data.user.id;
    });

    test('POST /api/auth/register — Rejects duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: validPassword,
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('USER_ALREADY_EXISTS');
    });

    test('POST /api/auth/login — Fails with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'WrongPassword456',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('POST /api/auth/login — Successfully logs in and returns JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: validPassword,
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(uniqueEmail);
    });

    test('GET /api/auth/me — Rejects request without token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/auth/me — Retrieves profile with valid JWT (200)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(testUserId);
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('POST /api/auth/logout — Successfully logs out', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Chat Management & Persistence
  // --------------------------------------------------------------------------
  describe('Chat Management & Legal Reasoning', () => {
    test('GET /api/chat/db-status — Checks PostgreSQL connectivity probe', async () => {
      const res = await request(app).get('/api/chat/db-status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.configured).toBe(true);
    });

    test('POST /api/chat — Rejects empty message (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    test('POST /api/chat/conversations — Creates a conversation session', async () => {
      testSessionId = `test-sess-${Date.now()}`;
      const res = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionId: testSessionId, language: 'en' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe(testSessionId);
      testConversationId = res.body.data.id;
    });

    test('GET /api/chat/conversations — Lists conversations for authenticated user', async () => {
      const res = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c) => c.sessionId === testSessionId)).toBe(true);
    });

    test('GET /api/chat/conversations/:id — Retrieves conversation by sessionId', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe(testSessionId);
    });

    test('PATCH /api/chat/conversations/:id — Updates conversation attributes', async () => {
      const res = await request(app)
        .patch(`/api/chat/conversations/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'hi' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.language).toBe('hi');
    });

    test('POST /api/chat — Processes query with AI legal engine', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'My employer has not paid my salary for 3 months. What are my rights?',
          sessionId: testSessionId,
          language: 'en',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();
      expect(typeof res.body.data.answer).toBe('string');
      expect(res.body.data.sessionId).toBe(testSessionId);
      expect(res.body.data.persisted).toBe(true);
    }, 15000);

    test('DELETE /api/chat/conversations/:id — Deletes conversation', async () => {
      const res = await request(app)
        .delete(`/api/chat/conversations/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Legal Rights APIs
  // --------------------------------------------------------------------------
  describe('Legal Rights APIs', () => {
    test('GET /api/rights — Returns right categories with section counts', async () => {
      const res = await request(app).get('/api/rights');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('sectionCount');
    });

    test('GET /api/rights/search?q=wages — Searches legal sections', async () => {
      const res = await request(app).get('/api/rights/search?q=wages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.query).toBe('wages');
    });

    test('GET /api/rights/acts — Lists statutory acts with verification metadata', async () => {
      const res = await request(app).get('/api/rights/acts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('jurisdiction');
      expect(res.body.data[0]).toHaveProperty('verificationStatus');
    });

    test('GET /api/rights/sections — Lists statutory sections with pagination', async () => {
      const res = await request(app).get('/api/rights/sections?limit=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    test('GET /api/rights/beneficiaries — Lists vulnerable beneficiary groups', async () => {
      const res = await request(app).get('/api/rights/beneficiaries');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/rights/labour — Retrieves category details and its sections', async () => {
      const res = await request(app).get('/api/rights/labour');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('labour');
      expect(Array.isArray(res.body.data.sections)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Legal Aid & Workflow APIs
  // --------------------------------------------------------------------------
  describe('Legal Aid & Workflow APIs', () => {
    test('GET /api/aid — Retrieves legal aid providers directory', async () => {
      const res = await request(app).get('/api/aid');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('type');
      expect(res.body.data[0]).toHaveProperty('phone');
    });

    test('GET /api/aid/districts/Delhi — Lists districts for state', async () => {
      const res = await request(app).get('/api/aid/districts/Delhi');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('POST /api/aid/nalsa-eligibility — Assesses NALSA Section 12 criteria', async () => {
      const res = await request(app)
        .post('/api/aid/nalsa-eligibility')
        .send({ annualIncome: 50000, category: 'WORKERS' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.helpline).toBe('15100');
    });

    test('GET /api/workflows — Lists complaint workflows with step sequences', async () => {
      const res = await request(app).get('/api/workflows');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('steps');
    });

    test('GET /api/workflows/labour — Retrieves workflow by category', async () => {
      const res = await request(app).get('/api/workflows/labour');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('LABOUR');
      expect(Array.isArray(res.body.data.steps)).toBe(true);
      expect(res.body.data.steps[0]).toHaveProperty('requiredDocuments');
    });

    test('POST /api/eligibility — Evaluates statutory legal aid eligibility', async () => {
      const res = await request(app)
        .post('/api/eligibility')
        .send({
          income: 75000,
          state: 'Maharashtra',
          category: 'LABOUR',
          beneficiaryType: 'WORKERS',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eligible).toBe(true);
      expect(Array.isArray(res.body.data.schemes)).toBe(true);
      expect(res.body.data.reason).toBeDefined();
    });

    test('POST /api/eligibility — Rejects negative income (Validation 400)', async () => {
      const res = await request(app)
        .post('/api/eligibility')
        .send({
          income: -5000,
          state: 'Delhi',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });
  });
});
