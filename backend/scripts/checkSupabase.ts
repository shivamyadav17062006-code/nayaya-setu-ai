import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '✗ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in backend/.env'
  );
  process.exit(1);
}

const supabase = createClient(url, key);

const TABLES = [
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

async function main(): Promise<void> {
  console.log(`Checking Supabase project: ${url}\n`);
  let failures = 0;

  for (const table of TABLES) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      failures += 1;
    } else {
      console.log(`✓ ${table} (${count ?? '?'} rows visible)`);
    }
  }

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
      `\n${failures} check(s) failed. Run supabase/schema.sql in the Supabase SQL Editor first.`
    );
    process.exit(1);
  }

  console.log('\nAll Supabase checks passed.');
}

main();
