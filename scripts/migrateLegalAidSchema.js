/**
 * NyayaSaathi — Phase 14: Legal Aid Schema Migration
 * Non-destructive DDL migration for:
 * 1. public.legal_aid_income_limits
 * 2. public.legal_aid_assessments
 * 3. Adding helpline, official_source, latitude, longitude to legal_aid_providers
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { prisma } from '../backend/src/lib/prisma.js';

async function migrate() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 14: LEGAL AID SCHEMA MIGRATION');
  console.log('='.repeat(80));

  try {
    // 1. Extend legal_aid_providers with helpline, official_source, coordinates
    console.log('[1/3] Extending public.legal_aid_providers...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.legal_aid_providers 
      ADD COLUMN IF NOT EXISTS helpline TEXT,
      ADD COLUMN IF NOT EXISTS official_source TEXT,
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';
    `);
    console.log('  ✓ legal_aid_providers extended successfully.');

    // 2. Create legal_aid_income_limits
    console.log('[2/3] Creating public.legal_aid_income_limits...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.legal_aid_income_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        state TEXT NOT NULL,
        court_level TEXT NOT NULL DEFAULT 'SUBORDINATE_COURT',
        annual_income_limit INT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        applicable_notification TEXT,
        official_source TEXT,
        effective_date TEXT,
        last_verified_at TIMESTAMPTZ DEFAULT NOW(),
        verification_status TEXT DEFAULT 'VERIFIED',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_income_limits_state ON public.legal_aid_income_limits(state);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_income_limits_court ON public.legal_aid_income_limits(court_level);
    `);
    console.log('  ✓ legal_aid_income_limits created successfully.');

    // 3. Create legal_aid_assessments
    console.log('[3/3] Creating public.legal_aid_assessments...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.legal_aid_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        session_id TEXT,
        status TEXT NOT NULL,
        category TEXT,
        state TEXT,
        court_level TEXT,
        annual_income INT,
        is_statutory_exempt BOOLEAN DEFAULT FALSE,
        statutory_clause TEXT,
        explanation TEXT NOT NULL,
        criteria_breakdown JSONB DEFAULT '{}'::JSONB,
        disclaimer TEXT NOT NULL,
        user_consent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_aid_assessments_user ON public.legal_aid_assessments(user_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_aid_assessments_session ON public.legal_aid_assessments(session_id);
    `);
    console.log('  ✓ legal_aid_assessments created successfully.');

    console.log('\n✅ All Phase 14 schema tables verified and ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
