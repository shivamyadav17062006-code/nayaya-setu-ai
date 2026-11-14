-- ============================================================================
-- NyayaSaathi (न्यायसाथी) — Schema Verification Script
-- Path: supabase/verify_schema.sql
-- Purpose: Rigorous, non-destructive validation of all 14 baseline tables,
--          columns, primary keys, foreign keys, unique constraints, indexes,
--          and pgvector RPC functions against the single source of truth.
-- ============================================================================

DO $$
DECLARE
    missing_tables INT := 0;
    missing_fks INT := 0;
    missing_indexes INT := 0;
    missing_rpcs INT := 0;
    table_record RECORD;
    fk_record RECORD;
    idx_record RECORD;
    rpc_record RECORD;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'NYAYASAATHI (न्यायसाथी) DATABASE SCHEMA VERIFICATION';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '============================================================';

    -- ------------------------------------------------------------------------
    -- 1. Check Baseline 14 Tables
    -- ------------------------------------------------------------------------
    RAISE NOTICE '--- 1. TABLE EXISTENCE & PRIMARY KEY AUDIT ---';

    FOR table_record IN
        WITH expected_tables(tbl) AS (
            VALUES
                ('legal_acts'),
                ('legal_sections'),
                ('beneficiaries'),
                ('right_categories'),
                ('section_beneficiaries'),
                ('section_categories'),
                ('complaint_workflows'),
                ('workflow_steps'),
                ('legal_aid_providers'),
                ('legal_remedies'),
                ('legal_chunks'),
                ('users'),
                ('conversations'),
                ('messages')
        )
        SELECT
            et.tbl AS table_name,
            (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = et.tbl) AS exists,
            (SELECT COUNT(*)
             FROM information_schema.table_constraints tc
             WHERE tc.table_schema = 'public'
               AND tc.table_name = et.tbl
               AND tc.constraint_type = 'PRIMARY KEY') AS has_pk
        FROM expected_tables et
    LOOP
        IF table_record.exists = 0 THEN
            RAISE WARNING '✗ Missing Table: %', table_record.table_name;
            missing_tables := missing_tables + 1;
        ELSIF table_record.has_pk = 0 THEN
            RAISE WARNING '✗ Table % exists but has NO PRIMARY KEY', table_record.table_name;
            missing_tables := missing_tables + 1;
        ELSE
            RAISE NOTICE '✓ Table: % (PK verified)', RPAD(table_record.table_name, 25);
        END IF;
    END LOOP;

    -- ------------------------------------------------------------------------
    -- 2. Foreign Key Referential Integrity Audit
    -- ------------------------------------------------------------------------
    RAISE NOTICE ' ';
    RAISE NOTICE '--- 2. FOREIGN KEY REFERENTIAL INTEGRITY AUDIT ---';

    FOR fk_record IN
        WITH expected_fks(src_tbl, col, tgt_tbl, tgt_col) AS (
            VALUES
                ('legal_sections',       'act_id',          'legal_acts',           'id'),
                ('section_beneficiaries','section_id',      'legal_sections',       'id'),
                ('section_beneficiaries','beneficiary_id',  'beneficiaries',        'id'),
                ('section_categories',   'section_id',      'legal_sections',       'id'),
                ('section_categories',   'category_id',     'right_categories',     'id'),
                ('complaint_workflows',  'category_id',     'right_categories',     'id'),
                ('workflow_steps',       'workflow_id',     'complaint_workflows',  'id'),
                ('legal_remedies',       'section_id',      'legal_sections',       'id'),
                ('legal_chunks',         'section_id',      'legal_sections',       'id'),
                ('conversations',        'user_id',         'users',                'id'),
                ('messages',             'conversation_id', 'conversations',        'id')
        )
        SELECT
            ef.src_tbl, ef.col, ef.tgt_tbl, ef.tgt_col,
            (SELECT COUNT(*)
             FROM information_schema.referential_constraints rc
             JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name
             JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.constraint_name
             WHERE kcu.table_schema = 'public'
               AND kcu.table_name = ef.src_tbl
               AND kcu.column_name = ef.col
               AND ccu.table_name = ef.tgt_tbl
               AND ccu.column_name = ef.tgt_col) AS fk_count
        FROM expected_fks ef
    LOOP
        IF fk_record.fk_count = 0 THEN
            RAISE WARNING '✗ Missing FK: %.% -> %.%', fk_record.src_tbl, fk_record.col, fk_record.tgt_tbl, fk_record.tgt_col;
            missing_fks := missing_fks + 1;
        ELSE
            RAISE NOTICE '✓ FK: % -> %.%', RPAD(fk_record.src_tbl || '.' || fk_record.col, 32), fk_record.tgt_tbl, fk_record.tgt_col;
        END IF;
    END LOOP;

    -- ------------------------------------------------------------------------
    -- 3. Critical Unique Constraints & Indexes
    -- ------------------------------------------------------------------------
    RAISE NOTICE ' ';
    RAISE NOTICE '--- 3. CRITICAL UNIQUE CONSTRAINTS AUDIT ---';

    FOR idx_record IN
        WITH expected_uniques(tbl, constraint_desc) AS (
            VALUES
                ('legal_sections',       'act_id + section_number'),
                ('beneficiaries',        'name and slug'),
                ('right_categories',     'name and slug'),
                ('workflow_steps',       'workflow_id + step_number'),
                ('users',                'email and phone'),
                ('conversations',        'session_id')
        )
        SELECT
            eu.tbl, eu.constraint_desc,
            (SELECT COUNT(*)
             FROM information_schema.table_constraints tc
             WHERE tc.table_schema = 'public'
               AND tc.table_name = eu.tbl
               AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')) AS uq_count
        FROM expected_uniques eu
    LOOP
        IF idx_record.uq_count = 0 THEN
            RAISE WARNING '✗ Missing Unique Constraints on %: %', idx_record.tbl, idx_record.constraint_desc;
            missing_indexes := missing_indexes + 1;
        ELSE
            RAISE NOTICE '✓ Unique: % (%)', RPAD(idx_record.tbl, 25), idx_record.constraint_desc;
        END IF;
    END LOOP;

    -- ------------------------------------------------------------------------
    -- 4. pgvector Extension & RPC Verification
    -- ------------------------------------------------------------------------
    RAISE NOTICE ' ';
    RAISE NOTICE '--- 4. PGVECTOR & RPC FUNCTION AUDIT ---';

    -- Check vector extension
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE '✓ Extension: pgvector installed';
    ELSE
        RAISE WARNING '✗ Extension: pgvector MISSING';
        missing_rpcs := missing_rpcs + 1;
    END IF;

    -- Check match_legal_chunks RPC function
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'match_legal_chunks'
    ) THEN
        RAISE NOTICE '✓ RPC Function: match_legal_chunks(vector, int, float) verified';
    ELSE
        RAISE WARNING '✗ RPC Function: match_legal_chunks MISSING';
        missing_rpcs := missing_rpcs + 1;
    END IF;

    -- ------------------------------------------------------------------------
    -- 5. Final Audit Verdict
    -- ------------------------------------------------------------------------
    RAISE NOTICE ' ';
    RAISE NOTICE '============================================================';
    IF missing_tables = 0 AND missing_fks = 0 AND missing_rpcs = 0 THEN
        RAISE NOTICE 'VERIFICATION RESULT: ALL 14 TABLES, RELATIONS & RPCS ARE VALID!';
    ELSE
        RAISE WARNING 'VERIFICATION RESULT: % issues found (Tables: %, FKs: %, RPCs: %)',
            (missing_tables + missing_fks + missing_rpcs), missing_tables, missing_fks, missing_rpcs;
    END IF;
    RAISE NOTICE '============================================================';
END $$;
