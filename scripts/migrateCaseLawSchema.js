/**
 * NyayaSaathi — Phase 10D: Case Law & Judicial Precedent Database Schema Migration
 *
 * Creates:
 * 1. public.court_judgments
 * 2. public.judgment_statute_links
 * 3. public.judgment_chunks (with vector(384) embeddings)
 * 4. public.match_case_law RPC function
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

async function migrateCaseLaw() {
  console.log('='.repeat(80));
  console.log('⚖️  NYAYASAATHI PHASE 10D: CASE LAW SCHEMA MIGRATION');
  console.log('='.repeat(80));

  try {
    // 1. Enable pgvector
    await runSql(`CREATE EXTENSION IF NOT EXISTS vector;`, 'pgvector extension');

    // 2. Create court_judgments table
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.court_judgments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_title TEXT NOT NULL,
        citation TEXT NOT NULL,
        neutral_citation TEXT,
        court_name TEXT NOT NULL,
        court_level TEXT NOT NULL DEFAULT 'SUPREME_COURT',
        jurisdiction TEXT NOT NULL DEFAULT 'ALL_INDIA',
        precedent_authority TEXT NOT NULL DEFAULT 'BINDING_NATIONWIDE',
        case_number TEXT,
        decision_date DATE NOT NULL,
        bench TEXT NOT NULL,
        coram_size INT DEFAULT 1,
        source_url TEXT NOT NULL,
        pdf_source_url TEXT,
        checksum TEXT,
        summary_facts TEXT,
        issues TEXT[] DEFAULT '{}',
        ratio_decidendi TEXT NOT NULL,
        obiter_dicta TEXT,
        final_order TEXT,
        subsequent_treatment TEXT,
        is_summary_machine_generated BOOLEAN DEFAULT TRUE,
        verification_status TEXT DEFAULT 'PUBLISHED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.court_judgments');

    // 3. Create judgment_statute_links table
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.judgment_statute_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        judgment_id UUID NOT NULL REFERENCES public.court_judgments(id) ON DELETE CASCADE,
        act_title TEXT NOT NULL,
        act_id UUID REFERENCES public.legal_acts(id) ON DELETE SET NULL,
        provision_cited TEXT NOT NULL,
        relationship_type TEXT NOT NULL DEFAULT 'INTERPRETED',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.judgment_statute_links');

    // 4. Create judgment_chunks table
    await runSql(`
      CREATE TABLE IF NOT EXISTS public.judgment_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        judgment_id UUID NOT NULL REFERENCES public.court_judgments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        paragraph_number INT,
        chunk_type TEXT DEFAULT 'RATIO',
        source_url TEXT,
        embedding vector(384),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `, 'Table: public.judgment_chunks');

    // 5. Index on judgment_chunks
    await runSql(`
      CREATE INDEX IF NOT EXISTS idx_judgment_chunks_judgment_id 
      ON public.judgment_chunks(judgment_id);
    `, 'Index: idx_judgment_chunks_judgment_id');

    // 6. RLS
    await runSql(`ALTER TABLE public.court_judgments ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on court_judgments');
    await runSql(`ALTER TABLE public.judgment_statute_links ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on judgment_statute_links');
    await runSql(`ALTER TABLE public.judgment_chunks ENABLE ROW LEVEL SECURITY;`, 'Enable RLS on judgment_chunks');

    await runSql(`DROP POLICY IF EXISTS "Public can view verified judgments" ON public.court_judgments;`, 'Drop old policy court_judgments');
    await runSql(`
      CREATE POLICY "Public can view verified judgments"
      ON public.court_judgments FOR SELECT
      USING (verification_status IN ('VERIFIED', 'PUBLISHED'));
    `, 'Create policy court_judgments');

    await runSql(`DROP POLICY IF EXISTS "Public can view judgment links" ON public.judgment_statute_links;`, 'Drop old policy links');
    await runSql(`
      CREATE POLICY "Public can view judgment links"
      ON public.judgment_statute_links FOR SELECT
      USING (true);
    `, 'Create policy links');

    await runSql(`DROP POLICY IF EXISTS "Public can view judgment chunks" ON public.judgment_chunks;`, 'Drop old policy chunks');
    await runSql(`
      CREATE POLICY "Public can view judgment chunks"
      ON public.judgment_chunks FOR SELECT
      USING (true);
    `, 'Create policy chunks');

    // 7. Drop and Create match_case_law RPC
    await runSql(`DROP FUNCTION IF EXISTS public.match_case_law(vector, integer, double precision);`, 'Drop match_case_law 3 params');
    await runSql(`DROP FUNCTION IF EXISTS public.match_case_law(vector, integer, double precision, text);`, 'Drop match_case_law 4 params');

    await runSql(`
      CREATE OR REPLACE FUNCTION public.match_case_law (
          query_embedding vector(384),
          match_count INT DEFAULT 5,
          min_similarity FLOAT DEFAULT 0.0,
          target_court TEXT DEFAULT NULL
      )
      RETURNS TABLE (
          id UUID,
          judgment_id UUID,
          case_title TEXT,
          citation TEXT,
          court_name TEXT,
          court_level TEXT,
          jurisdiction TEXT,
          precedent_authority TEXT,
          decision_date DATE,
          bench TEXT,
          source_url TEXT,
          content TEXT,
          paragraph_number INT,
          chunk_type TEXT,
          ratio_decidendi TEXT,
          subsequent_treatment TEXT,
          is_summary_machine_generated BOOLEAN,
          similarity FLOAT
      )
      LANGUAGE SQL
      STABLE
      AS $$
          SELECT
              jc.id,
              jc.judgment_id,
              cj.case_title,
              cj.citation,
              cj.court_name,
              cj.court_level,
              cj.jurisdiction,
              cj.precedent_authority,
              cj.decision_date,
              cj.bench,
              cj.source_url,
              jc.content,
              jc.paragraph_number,
              jc.chunk_type,
              cj.ratio_decidendi,
              cj.subsequent_treatment,
              cj.is_summary_machine_generated,
              1 - (jc.embedding <=> query_embedding) AS similarity
          FROM public.judgment_chunks jc
          JOIN public.court_judgments cj ON cj.id = jc.judgment_id
          WHERE jc.embedding IS NOT NULL
            AND (cj.verification_status IN ('VERIFIED', 'PUBLISHED') OR cj.verification_status IS NULL)
            AND (target_court IS NULL OR cj.court_name ILIKE '%' || target_court || '%' OR cj.court_level = target_court)
            AND 1 - (jc.embedding <=> query_embedding) >= min_similarity
          ORDER BY jc.embedding <=> query_embedding
          LIMIT match_count;
      $$;
    `, 'Create match_case_law RPC function');

    await runSql(`GRANT EXECUTE ON FUNCTION public.match_case_law(vector, integer, double precision, text) TO anon, authenticated, service_role;`, 'Grant EXECUTE on match_case_law');
    await runSql(`GRANT SELECT ON public.court_judgments TO anon, authenticated, service_role;`, 'Grant SELECT on court_judgments');
    await runSql(`GRANT SELECT ON public.judgment_statute_links TO anon, authenticated, service_role;`, 'Grant SELECT on judgment_statute_links');
    await runSql(`GRANT SELECT ON public.judgment_chunks TO anon, authenticated, service_role;`, 'Grant SELECT on judgment_chunks');

    console.log('\n✅ CASE LAW DATABASE SCHEMA MIGRATION COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCaseLaw();
