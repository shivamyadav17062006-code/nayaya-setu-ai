/**
 * NyayaSaathi — Phase 12: Schema Migration for Saved Rights Discoveries
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runSql(sql, desc) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`✓ ${desc}`);
  } catch (err) {
    console.error(`✗ Error executing ${desc}:`, err.message);
    throw err;
  }
}

async function migrate() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 12: RIGHTS DISCOVERY SCHEMA MIGRATION');
  console.log('='.repeat(80));

  try {
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.saved_rights_discoveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_token TEXT UNIQUE NOT NULL,
        situation_summary TEXT,
        context_data JSONB DEFAULT '{}'::jsonb,
        discovery_results JSONB NOT NULL,
        user_consent BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
      );
    `, 'Table: public.saved_rights_discoveries');

    await runSql(`
      CREATE INDEX IF NOT EXISTS idx_saved_rights_token 
      ON public.saved_rights_discoveries(session_token);
    `, 'Index: idx_saved_rights_token');

    await runSql(`
      ALTER TABLE public.saved_rights_discoveries ENABLE ROW LEVEL SECURITY;
    `, 'Enable RLS: saved_rights_discoveries');

    await runSql(`
      DROP POLICY IF EXISTS "Public access to saved discoveries" ON public.saved_rights_discoveries;
    `, 'Drop old policy if exists');

    await runSql(`
      CREATE POLICY "Public access to saved discoveries"
      ON public.saved_rights_discoveries FOR ALL
      USING (true)
      WITH CHECK (true);
    `, 'Policy: Public access to saved discoveries');

    await runSql(`
      GRANT ALL ON public.saved_rights_discoveries TO anon, authenticated, service_role;
    `, 'Grant permissions: saved_rights_discoveries');

    console.log('\n✅ PHASE 12 SCHEMA MIGRATION COMPLETED');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
