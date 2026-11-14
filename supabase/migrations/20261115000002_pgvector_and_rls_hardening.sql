-- ============================================================================
-- Migration: 20261115000002_pgvector_and_rls_hardening.sql
-- Description: pgvector index verification, match_legal_chunks RPC hardening
--              (status & verification filters), and comprehensive RLS policies.
-- Single Source of Truth: PostgreSQL / Supabase
-- ============================================================================

-- STEP 1: Ensure pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 2: Ensure HNSW Cosine Distance Index on legal_chunks
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING hnsw (embedding vector_cosine_ops);

-- STEP 3: Create or Replace Hardened match_legal_chunks RPC Function
DROP FUNCTION IF EXISTS match_legal_chunks(vector, integer);
DROP FUNCTION IF EXISTS match_legal_chunks(vector, integer, double precision);

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
    categories TEXT
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
        ) AS categories
    FROM legal_chunks lc
    JOIN legal_sections ls ON ls.id = lc.section_id
    JOIN legal_acts la ON la.id = ls.act_id
    WHERE lc.embedding IS NOT NULL
      AND (la.verification_status = 'VERIFIED' OR la.verification_status IS NULL)
      AND (la.status = 'ACTIVE' OR la.status IS NULL)
      AND 1 - (lc.embedding <=> query_embedding) >= min_similarity
    ORDER BY lc.embedding <=> query_embedding
    LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_legal_chunks(vector, integer, double precision)
TO anon, authenticated, service_role;

-- STEP 4: Hardened Row Level Security (RLS) Configuration

-- 4.1 Enable RLS on all tables
ALTER TABLE legal_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_aid_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_remedies ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4.2 Read policies for public statutory knowledge
DROP POLICY IF EXISTS "Public can read legal acts" ON legal_acts;
CREATE POLICY "Public can read legal acts" 
ON legal_acts FOR SELECT 
TO anon, authenticated 
USING (verification_status = 'VERIFIED' OR verification_status IS NULL);

DROP POLICY IF EXISTS "Public can read legal sections" ON legal_sections;
CREATE POLICY "Public can read legal sections" 
ON legal_sections FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read beneficiaries" ON beneficiaries;
CREATE POLICY "Public can read beneficiaries" 
ON beneficiaries FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read categories" ON right_categories;
CREATE POLICY "Public can read categories" 
ON right_categories FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read section beneficiaries" ON section_beneficiaries;
CREATE POLICY "Public can read section beneficiaries" 
ON section_beneficiaries FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read section categories" ON section_categories;
CREATE POLICY "Public can read section categories" 
ON section_categories FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read complaint workflows" ON complaint_workflows;
CREATE POLICY "Public can read complaint workflows" 
ON complaint_workflows FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read workflow steps" ON workflow_steps;
CREATE POLICY "Public can read workflow steps" 
ON workflow_steps FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read legal aid providers" ON legal_aid_providers;
CREATE POLICY "Public can read legal aid providers" 
ON legal_aid_providers FOR SELECT 
TO anon, authenticated 
USING (verified = true OR is_active = true);

DROP POLICY IF EXISTS "Public can read legal remedies" ON legal_remedies;
CREATE POLICY "Public can read legal remedies" 
ON legal_remedies FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public can read legal chunks" ON legal_chunks;
CREATE POLICY "Public can read legal chunks" 
ON legal_chunks FOR SELECT 
TO anon, authenticated 
USING (true);

-- 4.3 Permissions
GRANT SELECT ON legal_acts, legal_sections, beneficiaries, right_categories, 
section_beneficiaries, section_categories, complaint_workflows, 
workflow_steps, legal_aid_providers, legal_chunks, legal_remedies TO anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- STEP 5: Notify PostgREST to Reload Schema Cache
NOTIFY pgrst, 'reload schema';
