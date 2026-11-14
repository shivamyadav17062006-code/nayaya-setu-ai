-- ============================================================================
-- Migration: 20261114000001_enable_app_persistence_and_chunks_rls.sql
-- Purpose: Grant necessary RLS access for AI vector ingestion (legal_chunks)
--          and application persistence (conversations & messages).
-- ============================================================================

-- 1. Enable write and upsert permissions for vector embeddings on legal_chunks
DROP POLICY IF EXISTS "Public can insert legal chunks" ON legal_chunks;
DROP POLICY IF EXISTS "Public can update legal chunks" ON legal_chunks;
DROP POLICY IF EXISTS "Public can all legal chunks" ON legal_chunks;

CREATE POLICY "Allow write legal chunks"
ON legal_chunks FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 2. Allow session-based chat conversation creation & retrieval
DROP POLICY IF EXISTS "Public can create conversations" ON conversations;
DROP POLICY IF EXISTS "Public can read conversations" ON conversations;

CREATE POLICY "Allow public insert conversations"
ON conversations FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Allow public select conversations"
ON conversations FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 3. Allow session-based message logging & retrieval
DROP POLICY IF EXISTS "Public can insert messages" ON messages;
DROP POLICY IF EXISTS "Public can select messages" ON messages;

CREATE POLICY "Allow public insert messages"
ON messages FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Allow public select messages"
ON messages FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
