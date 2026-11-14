/**
 * NyayaSaathi — Migration: Upgrade match_legal_chunks for State Jurisdiction Filtering
 *
 * Adds act_jurisdiction and act_state return columns and supports both VERIFIED and PUBLISHED statuses.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrateRPC() {
  console.log('='.repeat(80));
  console.log('🔄 UPGRADING match_legal_chunks RPC FOR JURISDICTION FILTERING');
  console.log('='.repeat(80));

  try {
    // 1. Drop existing function signatures
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS match_legal_chunks(vector, integer);`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS match_legal_chunks(vector, integer, double precision);`);
    console.log('✓ Dropped old function signatures');

    // 2. Create updated function with act_jurisdiction and act_state
    const sql = `
      CREATE OR REPLACE FUNCTION match_legal_chunks (
          query_embedding vector(384),
          match_count INT DEFAULT 5,
          min_similarity FLOAT DEFAULT 0.0
      )
      RETURNS TABLE (
          id UUID,
          section_id UUID,
          content TEXT,
          chunk_number INT,
          language TEXT,
          source_url TEXT,
          similarity FLOAT,
          section_number TEXT,
          section_title TEXT,
          simplified_text TEXT,
          original_text TEXT,
          act_title TEXT,
          act_year INT,
          act_source_url TEXT,
          categories TEXT,
          act_jurisdiction TEXT,
          act_state TEXT
      )
      LANGUAGE SQL
      STABLE
      AS $$
          SELECT
              lc.id,
              lc.section_id,
              lc.content,
              lc.chunk_number,
              lc.language,
              lc.source_url,
              1 - (lc.embedding <=> query_embedding) AS similarity,
              ls.section_number,
              ls.section_title,
              ls.simplified_text,
              ls.original_text,
              la.title AS act_title,
              la.year AS act_year,
              la.source_url AS act_source_url,
              (
                  SELECT string_agg(rc.name, ', ' ORDER BY rc.name)
                  FROM section_categories sc
                  JOIN right_categories rc ON rc.id = sc.category_id
                  WHERE sc.section_id = ls.id
              ) AS categories,
              la.jurisdiction::TEXT AS act_jurisdiction,
              la.state AS act_state
          FROM legal_chunks lc
          JOIN legal_sections ls ON ls.id = lc.section_id
          JOIN legal_acts la ON la.id = ls.act_id
          WHERE lc.embedding IS NOT NULL
            AND (la.verification_status IN ('VERIFIED', 'PUBLISHED') OR la.verification_status IS NULL)
            AND (la.status = 'ACTIVE' OR la.status IS NULL)
            AND 1 - (lc.embedding <=> query_embedding) >= min_similarity
          ORDER BY lc.embedding <=> query_embedding
          LIMIT match_count;
      $$;
    `;

    await prisma.$executeRawUnsafe(sql);
    console.log('✓ Created updated match_legal_chunks RPC');

    await prisma.$executeRawUnsafe(`
      GRANT EXECUTE ON FUNCTION match_legal_chunks(vector, integer, double precision) TO anon, authenticated, service_role;
    `);
    console.log('✓ Granted permissions to anon, authenticated, service_role');

    // Test call with dummy vector
    const dummyVec = '[' + new Array(384).fill(0.01).join(',') + ']';
    const testResult = await prisma.$queryRawUnsafe(
      `SELECT id, act_title, act_jurisdiction, act_state, similarity FROM public.match_legal_chunks($1::vector, 1, -1.0)`,
      dummyVec
    );
    console.log('✓ RPC Verification Call Success! Returned test item:', testResult[0]);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRPC();
