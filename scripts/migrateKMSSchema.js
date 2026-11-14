/**
 * NyayaSaathi — Phase 11: Legal Knowledge Management System Schema Migration
 *
 * Adds:
 * 1. public.legal_audit_logs
 * 2. public.legal_revisions
 * 3. public.legal_import_batches
 * 4. Extends legal_acts and legal_sections with review workflow fields non-destructively
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

async function migrateKMS() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI PHASE 11: LEGAL KMS SCHEMA MIGRATION');
  console.log('='.repeat(80));

  try {
    // 1. Extend legal_acts with reviewer workflow columns
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS reviewer_id TEXT;`, 'legal_acts.reviewer_id');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS review_notes TEXT;`, 'legal_acts.review_notes');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;`, 'legal_acts.last_reviewed_at');
    await runSql(`ALTER TABLE public.legal_acts DROP CONSTRAINT IF EXISTS legal_acts_verification_status_check;`, 'Drop old verification_status constraint');
    await runSql(`
      ALTER TABLE public.legal_acts ADD CONSTRAINT legal_acts_verification_status_check 
      CHECK (verification_status = ANY (ARRAY[
        'DRAFT'::text, 'UNDER_REVIEW'::text, 'AWAITING_REVIEW'::text, 'PENDING'::text, 
        'NEEDS_REVIEW'::text, 'VERIFIED'::text, 'PUBLISHED'::text, 'SUPERSEDED'::text, 
        'REJECTED'::text, 'IMPORTED'::text, 'EXTRACTION_COMPLETE'::text
      ]));
    `, 'Recreate legal_acts_verification_status_check');

    // 2. Extend legal_sections with verification_status and reviewer fields
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PUBLISHED';`, 'legal_sections.verification_status');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS reviewer_id TEXT;`, 'legal_sections.reviewer_id');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS review_notes TEXT;`, 'legal_sections.review_notes');

    // 3. Create legal_audit_logs
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.legal_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        action TEXT NOT NULL,
        actor_id TEXT,
        actor_email TEXT,
        actor_role TEXT DEFAULT 'ADMIN',
        previous_state JSONB,
        new_state JSONB,
        review_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.legal_audit_logs');

    // 4. Create legal_revisions
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.legal_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        revision_number INT NOT NULL DEFAULT 1,
        title TEXT,
        content_snapshot JSONB NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.legal_revisions');

    // 5. Create legal_import_batches
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.legal_import_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_name TEXT NOT NULL,
        source_url TEXT,
        import_type TEXT NOT NULL DEFAULT 'JSON_IMPORT',
        status TEXT NOT NULL DEFAULT 'PENDING',
        total_records INT DEFAULT 0,
        imported_records INT DEFAULT 0,
        rejected_records INT DEFAULT 0,
        error_log JSONB DEFAULT '[]'::jsonb,
        imported_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.legal_import_batches');

    // 6. Indices
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_audit_entity ON public.legal_audit_logs(entity_type, entity_id);`, 'Index: idx_legal_audit_entity');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_revisions_entity ON public.legal_revisions(entity_type, entity_id);`, 'Index: idx_legal_revisions_entity');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_acts_verification ON public.legal_acts(verification_status);`, 'Index: idx_legal_acts_verification');

    // 7. RLS
    await runSql(`ALTER TABLE public.legal_audit_logs ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on legal_audit_logs');
    await runSql(`ALTER TABLE public.legal_revisions ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on legal_revisions');
    await runSql(`ALTER TABLE public.legal_import_batches ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on legal_import_batches');

    await runSql(`DROP POLICY IF EXISTS "Public can view audit logs" ON public.legal_audit_logs;`, 'Drop old policy legal_audit_logs');
    await runSql(`
      CREATE POLICY "Public can view audit logs"
      ON public.legal_audit_logs FOR SELECT
      USING (true);
    `, 'Create policy legal_audit_logs');

    await runSql(`DROP POLICY IF EXISTS "Public can view revisions" ON public.legal_revisions;`, 'Drop old policy legal_revisions');
    await runSql(`
      CREATE POLICY "Public can view revisions"
      ON public.legal_revisions FOR SELECT
      USING (true);
    `, 'Create policy legal_revisions');

    await runSql(`DROP POLICY IF EXISTS "Public can view import batches" ON public.legal_import_batches;`, 'Drop old policy legal_import_batches');
    await runSql(`
      CREATE POLICY "Public can view import batches"
      ON public.legal_import_batches FOR SELECT
      USING (true);
    `, 'Create policy legal_import_batches');

    await runSql(`GRANT ALL ON public.legal_audit_logs TO anon, authenticated, service_role;`, 'Grant permissions legal_audit_logs');
    await runSql(`GRANT ALL ON public.legal_revisions TO anon, authenticated, service_role;`, 'Grant permissions legal_revisions');
    await runSql(`GRANT ALL ON public.legal_import_batches TO anon, authenticated, service_role;`, 'Grant permissions legal_import_batches');

    console.log('\n✅ LEGAL KMS SCHEMA MIGRATION COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateKMS();
