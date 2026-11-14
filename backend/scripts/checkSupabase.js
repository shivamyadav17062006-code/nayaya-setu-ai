import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function sanitizeKey(key) {
  if (!key || key.startsWith('your-') || key.includes('[YOUR-')) return undefined;
  return key;
}

const url = process.env.SUPABASE_URL;
const key = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY) || sanitizeKey(process.env.SUPABASE_ANON_KEY);

if (!url || !key) {
  console.error(
    '✗ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in backend/.env'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const CORE_TABLES = [
  'legal_acts',
  'legal_sections',
  'beneficiaries',
  'right_categories',
  'section_beneficiaries',
  'section_categories',
  'complaint_workflows',
  'workflow_steps',
  'legal_aid_providers',
  'legal_chunks',
];

const APP_PERSISTENCE_TABLES = [
  'users',
  'conversations',
  'messages',
  'legal_remedies',
];

async function main() {
  console.log(`Checking Supabase project: ${url}\n`);
  let failures = 0;

  console.log('--- 1. Statutory Knowledge Graph Tables ---');
  for (const table of CORE_TABLES) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      failures += 1;
    } else {
      console.log(`✓ ${table} (${count ?? '?'} rows visible)`);
    }
  }

  console.log('\n--- 2. App & User Persistence Tables ---');
  for (const table of APP_PERSISTENCE_TABLES) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      failures += 1;
    } else {
      console.log(`✓ ${table} (${count ?? '?'} rows visible)`);
    }
  }

  console.log('\n--- 3. pgvector RPC Verification ---');
  const { error: rpcError } = await supabase.rpc('match_legal_chunks', {
    query_embedding: Array.from({ length: 384 }, () => 0),
    match_count: 1,
    min_similarity: 0,
  });

  if (rpcError) {
    console.error(`✗ match_legal_chunks RPC: ${rpcError.message}`);
    failures += 1;
  } else {
    console.log('✓ match_legal_chunks RPC');
  }

  if (failures > 0) {
    console.error(
      `\n${failures} check(s) failed. Run supabase/migrations/20261114000000_schema_alignment_and_persistence.sql or supabase/schema.sql in the Supabase SQL Editor.`
    );
    process.exit(1);
  }

  console.log('\nAll Supabase checks passed.');
}

main();
