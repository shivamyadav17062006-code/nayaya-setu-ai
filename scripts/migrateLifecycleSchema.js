/**
 * NyayaSaathi — Batch C: Database Legal Lifecycle & Temporal Validity Schema Migration
 *
 * Implements non-destructive additions:
 * 1. 14-State Legal Lifecycle for legal_acts and legal_sections
 * 2. Temporal validity (commencement_date, assent_date, gazette info, repeal dates)
 * 3. Savings clause tracking
 * 4. Temporal metadata columns in legal_chunks for version-aware RAG
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runSql(sql, desc) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ Error executing ${desc}:`, err.message);
    throw err;
  }
}

async function migrateLifecycleSchema() {
  console.log('='.repeat(80));
  console.log('🏛️  NYAYASAATHI BATCH C: LEGAL LIFECYCLE & TEMPORAL VALIDITY MIGRATION');
  console.log('='.repeat(80));

  try {
    // 1. Extend legal_acts table
    console.log('\n[1/4] Extending legal_acts with temporal validity & commencement tracking...');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS assent_date DATE;`, 'legal_acts.assent_date');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS gazette_number VARCHAR(128);`, 'legal_acts.gazette_number');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS gazette_date DATE;`, 'legal_acts.gazette_date');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS commencement_date DATE;`, 'legal_acts.commencement_date');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS repeal_date DATE;`, 'legal_acts.repeal_date');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS repealed_by_act_id UUID REFERENCES public.legal_acts(id) ON DELETE SET NULL;`, 'legal_acts.repealed_by_act_id');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS savings_clause_ref TEXT;`, 'legal_acts.savings_clause_ref');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS is_partially_commenced BOOLEAN DEFAULT false;`, 'legal_acts.is_partially_commenced');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS commenced_sections TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'legal_acts.commenced_sections');
    await runSql(`ALTER TABLE public.legal_acts ADD COLUMN IF NOT EXISTS staged_sections TEXT[] DEFAULT ARRAY[]::TEXT[];`, 'legal_acts.staged_sections');

    // 2. Extend legal_sections table
    console.log('\n[2/4] Extending legal_sections with section lifecycle status & savings notes...');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'IN_FORCE';`, 'legal_sections.status');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS amendment_act_ref TEXT;`, 'legal_sections.amendment_act_ref');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS savings_clause_notes TEXT;`, 'legal_sections.savings_clause_notes');
    await runSql(`ALTER TABLE public.legal_sections ADD COLUMN IF NOT EXISTS is_operative BOOLEAN DEFAULT true;`, 'legal_sections.is_operative');

    // 3. Extend legal_chunks table
    console.log('\n[3/4] Extending legal_chunks with version-aware retrieval metadata...');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS legal_status VARCHAR(32) DEFAULT 'IN_FORCE';`, 'legal_chunks.legal_status');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS effective_from DATE;`, 'legal_chunks.effective_from');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS effective_to DATE;`, 'legal_chunks.effective_to');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(32) DEFAULT 'CENTRAL';`, 'legal_chunks.jurisdiction');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS act_title TEXT;`, 'legal_chunks.act_title');
    await runSql(`ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS section_number VARCHAR(64);`, 'legal_chunks.section_number');

    // 4. Performance Indexes
    console.log('\n[4/4] Creating performance indexes for temporal & status filtering...');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_acts_status ON public.legal_acts(status);`, 'idx_legal_acts_status');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_acts_commencement ON public.legal_acts(commencement_date);`, 'idx_legal_acts_commencement');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_sections_status ON public.legal_sections(status);`, 'idx_legal_sections_status');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_sections_operative ON public.legal_sections(is_operative);`, 'idx_legal_sections_operative');
    await runSql(`CREATE INDEX IF NOT EXISTS idx_legal_chunks_status_jurisdiction ON public.legal_chunks(legal_status, jurisdiction);`, 'idx_legal_chunks_status_jurisdiction');

    console.log('\n✅ BATCH C DATABASE MIGRATION APPLIED SUCCESSFULLY WITH ZERO DATA LOSS.');
  } catch (err) {
    console.error('\n❌ Migration aborted due to error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateLifecycleSchema();
