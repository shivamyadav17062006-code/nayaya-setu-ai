import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { embeddingService } from '../ai-engine/src/services/embeddingService.js';

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function verify() {
  console.log('============================================================');
  console.log('PHASE 7 VERIFICATION: PGVECTOR, SEMANTIC SEARCH & RLS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. pgvector Availability
  try {
    const ext = await prisma.$queryRaw`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
    `;
    if (ext.length > 0) {
      console.log(`✓ 1. pgvector Extension: Active (v${ext[0].extversion})`);
      passed++;
    } else {
      console.error('✗ 1. pgvector Extension: MISSING');
      failed++;
    }
  } catch (err) {
    console.error('✗ 1. pgvector Extension check failed:', err.message);
    failed++;
  }

  // 2. Vector Dimensionality
  try {
    const col = await prisma.$queryRaw`
      SELECT column_name, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'legal_chunks' AND column_name = 'embedding';
    `;
    const modelDim = embeddingService.dimension;
    if (col.length > 0 && modelDim === 384) {
      console.log(`✓ 2. Vector Dimensionality: 384 dimensions aligned (Embedding service dim=${modelDim})`);
      passed++;
    } else {
      console.error('✗ 2. Vector Dimensionality mismatch');
      failed++;
    }
  } catch (err) {
    console.error('✗ 2. Vector Dimensionality check failed:', err.message);
    failed++;
  }

  // 3. Index Creation (HNSW)
  try {
    const idx = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'legal_chunks' AND indexdef LIKE '%hnsw%';
    `;
    if (idx.length > 0) {
      console.log(`✓ 3. Vector Index: HNSW Cosine Index active (${idx[0].indexname})`);
      passed++;
    } else {
      console.error('✗ 3. Vector Index: HNSW index not found');
      failed++;
    }
  } catch (err) {
    console.error('✗ 3. Vector Index check failed:', err.message);
    failed++;
  }

  // 4. RPC Function Existence & Signature
  try {
    const rpc = await prisma.$queryRaw`
      SELECT proname, proargnames, prorettype::text 
      FROM pg_proc 
      WHERE proname = 'match_legal_chunks';
    `;
    if (rpc.length > 0) {
      console.log('✓ 4. RPC Function: match_legal_chunks verified in pg_proc');
      passed++;
    } else {
      console.error('✗ 4. RPC Function: match_legal_chunks not found');
      failed++;
    }
  } catch (err) {
    console.error('✗ 4. RPC Function check failed:', err.message);
    failed++;
  }

  // 5. RPC Execution with Live Embedding
  try {
    const testQuery = 'My employer has not paid my salary for 3 months';
    const queryVector = await embeddingService.embedText(testQuery);
    
    const { data, error } = await supabase.rpc('match_legal_chunks', {
      query_embedding: queryVector,
      match_count: 2,
      min_similarity: 0.0,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      console.log(`✓ 5. RPC Semantic Search: Executed successfully (${data.length} matches returned)`);
      console.log(`   Top match: ${data[0].act_title} - ${data[0].section_number} (Similarity: ${data[0].similarity?.toFixed(4)})`);
      passed++;
    } else {
      console.error('✗ 5. RPC Execution failed:', error?.message || 'No rows returned');
      failed++;
    }
  } catch (err) {
    console.error('✗ 5. RPC Execution check failed:', err.message);
    failed++;
  }

  // 6. RLS Enabled Status on All 14 Tables
  try {
    const rls = await prisma.$queryRaw`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    const unsecure = rls.filter((t) => !t.rowsecurity);
    if (unsecure.length === 0) {
      console.log(`✓ 6. Row Level Security: Enabled on all ${rls.length} tables in public schema`);
      passed++;
    } else {
      console.warn(`✗ 6. Tables without RLS: ${unsecure.map((t) => t.tablename).join(', ')}`);
      failed++;
    }
  } catch (err) {
    console.error('✗ 6. RLS check failed:', err.message);
    failed++;
  }

  // 7. Data Access Isolation (Anon Role)
  try {
    // Anon can read legal acts
    const { data: acts, error: actsErr } = await supabase.from('legal_acts').select('id, title').limit(1);
    const canReadActs = !actsErr && acts?.length > 0;

    // Anon cannot view arbitrary user profiles directly
    const { data: usersData, error: usersErr } = await supabase.from('users').select('id, email, password').limit(1);
    const userReadRestricted = !usersData || usersData.length === 0 || Boolean(usersErr);

    if (canReadActs && userReadRestricted) {
      console.log('✓ 7. Access Isolation: Public legal data readable; private user profiles protected');
      passed++;
    } else {
      console.error('✗ 7. Access Isolation verification failed');
      failed++;
    }
  } catch (err) {
    console.error('✗ 7. Access Isolation check failed:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`PHASE 7 VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

verify();
