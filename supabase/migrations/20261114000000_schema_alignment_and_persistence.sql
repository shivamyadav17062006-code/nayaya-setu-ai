-- ============================================================================
-- Migration: 20261114000000_schema_alignment_and_persistence.sql
-- Description: Non-destructive database alignment between Supabase/PostgreSQL
--              and Prisma ORM.
-- Single Source of Truth: PostgreSQL / Supabase
-- Target Tables: 14 Core Tables
--
-- Safety Guarantees:
-- 1. Does NOT drop any existing table or column.
-- 2. Does NOT delete existing legal statutes, sections, or embeddings.
-- 3. Idempotent: Safe to execute repeatedly on existing or fresh databases.
-- 4. Secures sensitive tables (users, conversations, messages) with RLS.
-- 5. Signals PostgREST to reload its schema cache.
-- ============================================================================

-- STEP 1: Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 2: Align existing tables with non-destructive column additions

-- 2.1 legal_acts
ALTER TABLE legal_acts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE legal_acts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE legal_acts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.2 legal_sections
ALTER TABLE legal_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2.3 beneficiaries
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE beneficiaries SET slug = 'workers', icon = 'HardHat' WHERE name = 'Workers' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'women', icon = 'UserCheck' WHERE name = 'Women' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'children', icon = 'Baby' WHERE name = 'Children' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'seniors', icon = 'Heart' WHERE name = 'Senior Citizens' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'pwd', icon = 'LifeBuoy' WHERE name = 'Persons with Disabilities' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'sc-st', icon = 'Users' WHERE name = 'SC/ST Communities' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'tribal', icon = 'Globe' WHERE name = 'Tribal Communities' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = 'consumers', icon = 'ShoppingCart' WHERE name = 'Consumers' AND (slug IS NULL OR icon IS NULL);
UPDATE beneficiaries SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS beneficiaries_slug_key ON beneficiaries(slug);

-- 2.4 right_categories
ALTER TABLE right_categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE right_categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE right_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE right_categories SET slug = 'constitutional', icon = 'Scale' WHERE name = 'Constitutional Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'labour', icon = 'Briefcase' WHERE name = 'Labour Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'women', icon = 'ShieldAlert' WHERE name = 'Women Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'children', icon = 'Baby' WHERE name = 'Child Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'property', icon = 'Home' WHERE name = 'Property Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'consumer', icon = 'ShoppingBag' WHERE name = 'Consumer Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'criminal', icon = 'Gavel' WHERE name = 'Criminal Law' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'disability', icon = 'Accessibility' WHERE name = 'Disability Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'senior-citizens', icon = 'HeartHandshake' WHERE name = 'Senior Citizen Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = 'tribal', icon = 'Trees' WHERE name = 'Tribal Rights' AND (slug IS NULL OR icon IS NULL);
UPDATE right_categories SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS right_categories_slug_key ON right_categories(slug);

-- 2.5 complaint_workflows
ALTER TABLE complaint_workflows ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE complaint_workflows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE complaint_workflows cw
SET category = rc.slug
FROM right_categories rc
WHERE cw.category_id = rc.id AND cw.category IS NULL;

-- 2.6 workflow_steps
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS authority TEXT;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS documents TEXT[] DEFAULT '{}';
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS time_limit TEXT;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE workflow_steps SET description = instructions WHERE description IS NULL;
UPDATE workflow_steps SET documents = required_documents WHERE (documents IS NULL OR documents = '{}') AND required_documents IS NOT NULL;

-- 2.7 legal_aid_providers
ALTER TABLE legal_aid_providers ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE legal_aid_providers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE legal_aid_providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE legal_aid_providers SET is_active = verified WHERE is_active IS NULL;

-- ============================================================================
-- STEP 3: Create Missing Persistence & Remedy Tables
-- ============================================================================

-- 3.1 Users table (for authentication & account management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    name TEXT,
    state TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'PARALEGAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Conversations table (chat session container)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Messages table (individual chat dialogue turns with FK constraint)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    language TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Legal Remedies table
CREATE TABLE IF NOT EXISTS legal_remedies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES legal_sections(id) ON DELETE CASCADE,
    remedy_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    authority TEXT,
    contact_info TEXT,
    time_limit TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Supporting Performance Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS legal_acts_title_idx ON legal_acts (title);
CREATE INDEX IF NOT EXISTS legal_acts_category_idx ON legal_acts (category);
CREATE INDEX IF NOT EXISTS legal_acts_verification_status_idx ON legal_acts (verification_status);
CREATE INDEX IF NOT EXISTS legal_sections_act_id_idx ON legal_sections (act_id);
CREATE INDEX IF NOT EXISTS legal_sections_section_number_idx ON legal_sections (section_number);
CREATE INDEX IF NOT EXISTS beneficiaries_slug_idx ON beneficiaries (slug);
CREATE INDEX IF NOT EXISTS right_categories_slug_idx ON right_categories (slug);
CREATE INDEX IF NOT EXISTS section_beneficiaries_beneficiary_id_idx ON section_beneficiaries (beneficiary_id);
CREATE INDEX IF NOT EXISTS section_beneficiaries_section_id_idx ON section_beneficiaries (section_id);
CREATE INDEX IF NOT EXISTS section_categories_category_id_idx ON section_categories (category_id);
CREATE INDEX IF NOT EXISTS section_categories_section_id_idx ON section_categories (section_id);
CREATE INDEX IF NOT EXISTS complaint_workflows_category_id_idx ON complaint_workflows (category_id);
CREATE INDEX IF NOT EXISTS complaint_workflows_category_idx ON complaint_workflows (category);
CREATE INDEX IF NOT EXISTS workflow_steps_workflow_id_idx ON workflow_steps (workflow_id);
CREATE INDEX IF NOT EXISTS legal_aid_providers_state_idx ON legal_aid_providers (state);
CREATE INDEX IF NOT EXISTS legal_aid_providers_district_idx ON legal_aid_providers (district);
CREATE INDEX IF NOT EXISTS legal_aid_providers_type_idx ON legal_aid_providers (provider_type);
CREATE INDEX IF NOT EXISTS legal_remedies_section_id_idx ON legal_remedies (section_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
CREATE INDEX IF NOT EXISTS conversations_session_id_idx ON conversations (session_id);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations (created_at);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

-- ============================================================================
-- STEP 5: Row Level Security (RLS) & Access Hardening
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_remedies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON messages;
DROP POLICY IF EXISTS "Public can read legal remedies" ON legal_remedies;

-- 5.1 Strict privacy for users table
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 5.2 Private conversation and message policies
CREATE POLICY "Users can view own conversations" 
ON conversations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from own conversations" 
ON messages FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = messages.conversation_id 
        AND c.user_id = auth.uid()
    )
);

-- 5.3 Public read access for statutory legal remedies
CREATE POLICY "Public can read legal remedies" 
ON legal_remedies FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5.4 Permissions
GRANT SELECT ON legal_remedies TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 6: Reload PostgREST Schema Cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
