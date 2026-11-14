/**
 * NyayaSaathi — Phase 13: Legal Action Navigator & Complaint Workflow Schema Migration
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
  console.log('🏛️  NYAYASAATHI PHASE 13: WORKFLOW ENGINE SCHEMA MIGRATION');
  console.log('='.repeat(80));

  try {
    // 1. Extend complaint_workflows
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS eligibility_conditions TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'complaint_workflows.eligibility_conditions');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS applicable_laws TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'complaint_workflows.applicable_laws');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS required_documents TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'complaint_workflows.required_documents');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS verified_timelines TEXT;`, 'complaint_workflows.verified_timelines');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS fees TEXT;`, 'complaint_workflows.fees');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS escalation_route TEXT;`, 'complaint_workflows.escalation_route');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS appeal_mechanism TEXT;`, 'complaint_workflows.appeal_mechanism');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS official_source_links TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'complaint_workflows.official_source_links');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();`, 'complaint_workflows.last_verified_at');
    await runSql(`ALTER TABLE public.complaint_workflows ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';`, 'complaint_workflows.verification_status');

    // 2. Extend workflow_steps
    await runSql(`ALTER TABLE public.workflow_steps ADD COLUMN IF NOT EXISTS fees TEXT;`, 'workflow_steps.fees');
    await runSql(`ALTER TABLE public.workflow_steps ADD COLUMN IF NOT EXISTS conditional_branch JSONB;`, 'workflow_steps.conditional_branch');
    await runSql(`ALTER TABLE public.workflow_steps ADD COLUMN IF NOT EXISTS tips TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'workflow_steps.tips');

    // 3. Create user_workflow_progress
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.user_workflow_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        session_id TEXT,
        workflow_id UUID NOT NULL REFERENCES public.complaint_workflows(id) ON DELETE CASCADE,
        current_step INT NOT NULL DEFAULT 1,
        completed_steps INT[] DEFAULT ARRAY[]::INT[],
        checked_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
        branch_choices JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.user_workflow_progress');

    await runSql(`
      CREATE INDEX IF NOT EXISTS idx_workflow_progress_user 
      ON public.user_workflow_progress(user_id, workflow_id);
    `, 'Index: idx_workflow_progress_user');

    await runSql(`
      CREATE INDEX IF NOT EXISTS idx_workflow_progress_session 
      ON public.user_workflow_progress(session_id, workflow_id);
    `, 'Index: idx_workflow_progress_session');

    await runSql(`
      ALTER TABLE public.user_workflow_progress ENABLE ROW LEVEL SECURITY;
    `, 'Enable RLS: user_workflow_progress');

    await runSql(`
      DROP POLICY IF EXISTS "Public access to workflow progress" ON public.user_workflow_progress;
    `, 'Drop old policy');

    await runSql(`
      CREATE POLICY "Public access to workflow progress"
      ON public.user_workflow_progress FOR ALL
      USING (true)
      WITH CHECK (true);
    `, 'Create policy: user_workflow_progress');

    await runSql(`
      GRANT ALL ON public.user_workflow_progress TO anon, authenticated, service_role;
    `, 'Grant permissions: user_workflow_progress');

    console.log('\n✅ PHASE 13 SCHEMA MIGRATION COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
