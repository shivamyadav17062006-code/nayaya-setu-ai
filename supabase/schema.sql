-- ============================================================================
-- NyayaSaathi (न्यायसाथी) — Supabase PostgreSQL + pgvector Database Schema
-- Digital Assistant for Legal Awareness & Know Your Rights (KYR) Framework - India
-- Single Source of Truth for Database Schema, Migrations, and Prisma ORM
-- Exactly 14 Core Tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Statutory Knowledge Graph Tables (6 tables)
-- ============================================================================

-- 2.1 Legal Acts Table
CREATE TABLE IF NOT EXISTS legal_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    act_number TEXT,
    year INT NOT NULL,
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('CENTRAL', 'STATE')),
    state TEXT,
    category TEXT,
    description TEXT,
    source_url TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    effective_from DATE,
    effective_to DATE,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'NEEDS_REVIEW')),
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Legal Sections Table
CREATE TABLE IF NOT EXISTS legal_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id UUID NOT NULL REFERENCES legal_acts(id) ON DELETE CASCADE,
    section_number TEXT NOT NULL,
    section_title TEXT,
    original_text TEXT NOT NULL,
    simplified_text TEXT,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (act_id, section_number)
);

-- 2.3 Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Right Categories Table
CREATE TABLE IF NOT EXISTS right_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Section Beneficiaries (Many-to-Many)
CREATE TABLE IF NOT EXISTS section_beneficiaries (
    section_id UUID NOT NULL REFERENCES legal_sections(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    PRIMARY KEY (section_id, beneficiary_id)
);

-- 2.6 Section Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS section_categories (
    section_id UUID NOT NULL REFERENCES legal_sections(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES right_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (section_id, category_id)
);

-- ============================================================================
-- STEP 3: Complaints & Legal Aid Tables (4 tables)
-- ============================================================================

-- 3.1 Complaint Workflows Table
CREATE TABLE IF NOT EXISTS complaint_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    category_id UUID REFERENCES right_categories(id) ON DELETE SET NULL,
    jurisdiction TEXT DEFAULT 'BOTH' CHECK (jurisdiction IN ('CENTRAL', 'STATE', 'BOTH')),
    state TEXT,
    target_authority TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES complaint_workflows(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT,
    description TEXT,
    authority TEXT,
    required_documents TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    official_url TEXT,
    time_limit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workflow_id, step_number)
);

-- 3.3 Legal Aid Providers Table
CREATE TABLE IF NOT EXISTS legal_aid_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('NALSA', 'SLSA', 'DLSA', 'TLSC', 'NGO', 'OTHER')),
    state TEXT,
    district TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    eligibility_information TEXT,
    services TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Legal Remedies Table
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
-- STEP 4: AI & Vector Search (1 table + pgvector index)
-- ============================================================================

-- 4.1 Legal Chunks Table (384 Dimensions for MiniLM embeddings)
CREATE TABLE IF NOT EXISTS legal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES legal_sections(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_number INT NOT NULL DEFAULT 1,
    language TEXT DEFAULT 'en',
    source_url TEXT,
    embedding vector(384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 HNSW Vector Cosine Index
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 4.3 Unique Chunk Identity Index
CREATE UNIQUE INDEX IF NOT EXISTS legal_chunks_section_chunk_language_key
ON legal_chunks (section_id, chunk_number, language);

-- 4.4 Vector Similarity Match Function (for AI RAG Engine)
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
      AND 1 - (lc.embedding <=> query_embedding) >= min_similarity
    ORDER BY lc.embedding <=> query_embedding
    LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_legal_chunks(vector, integer, double precision)
TO anon, authenticated, service_role;

-- ============================================================================
-- STEP 5: Application Persistence Tables (3 tables)
-- ============================================================================

-- 5.1 Users Table
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

-- 5.2 Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.3 Messages Table (with Cascade Delete)
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

-- ============================================================================
-- STEP 6: Performance & Join Indexes
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
CREATE INDEX IF NOT EXISTS legal_chunks_section_id_idx ON legal_chunks (section_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
CREATE INDEX IF NOT EXISTS conversations_session_id_idx ON conversations (session_id);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations (created_at);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

-- ============================================================================
-- STEP 7: Row Level Security (RLS) & Access Hardening
-- ============================================================================
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

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can read legal acts" ON legal_acts;
DROP POLICY IF EXISTS "Public can read legal sections" ON legal_sections;
DROP POLICY IF EXISTS "Public can read beneficiaries" ON beneficiaries;
DROP POLICY IF EXISTS "Public can read categories" ON right_categories;
DROP POLICY IF EXISTS "Public can read section beneficiaries" ON section_beneficiaries;
DROP POLICY IF EXISTS "Public can read section categories" ON section_categories;
DROP POLICY IF EXISTS "Public can read complaint workflows" ON complaint_workflows;
DROP POLICY IF EXISTS "Public can read workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Public can read legal aid providers" ON legal_aid_providers;
DROP POLICY IF EXISTS "Public can read legal remedies" ON legal_remedies;
DROP POLICY IF EXISTS "Public can read legal chunks" ON legal_chunks;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON messages;

-- Public Legal Reading Policies
CREATE POLICY "Public can read legal acts" 
ON legal_acts FOR SELECT 
TO anon, authenticated 
USING (verification_status = 'VERIFIED');

CREATE POLICY "Public can read legal sections" 
ON legal_sections FOR SELECT 
TO anon, authenticated 
USING (
    EXISTS (
        SELECT 1 FROM legal_acts 
        WHERE legal_acts.id = legal_sections.act_id 
        AND legal_acts.verification_status = 'VERIFIED'
    )
);

CREATE POLICY "Public can read beneficiaries" 
ON beneficiaries FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read categories" 
ON right_categories FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read section beneficiaries" 
ON section_beneficiaries FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read section categories" 
ON section_categories FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read complaint workflows" 
ON complaint_workflows FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read workflow steps" 
ON workflow_steps FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read legal aid providers" 
ON legal_aid_providers FOR SELECT 
TO anon, authenticated 
USING (verified = true OR is_active = true);

CREATE POLICY "Public can read legal remedies" 
ON legal_remedies FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public can read legal chunks" 
ON legal_chunks FOR SELECT 
TO anon, authenticated 
USING (
    EXISTS (
        SELECT 1 FROM legal_sections s
        JOIN legal_acts a ON a.id = s.act_id
        WHERE s.id = legal_chunks.section_id
        AND a.verification_status = 'VERIFIED'
    )
);

-- Private User & Chat Policies
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

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

-- Grant Read Access to public API roles for legal awareness data
GRANT SELECT ON legal_acts, legal_sections, beneficiaries, right_categories, 
section_beneficiaries, section_categories, complaint_workflows, 
workflow_steps, legal_aid_providers, legal_chunks, legal_remedies TO anon, authenticated;

-- Service Role (Backend API) has full administrative access to all 14 tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 8: Verified Initial Indian Legal Seed Data
-- ============================================================================

-- Beneficiaries
INSERT INTO beneficiaries (name, slug, description, icon) VALUES
    ('Women', 'women', 'Women and their legal protections against domestic violence and workplace harassment', 'UserCheck'),
    ('Children', 'children', 'Children, child education rights and POCSO protections', 'Baby'),
    ('Senior Citizens', 'seniors', 'Rights, maintenance, and welfare of elderly citizens', 'Heart'),
    ('Persons with Disabilities', 'pwd', 'Equal opportunity and accessibility rights under RPwD Act 2016', 'LifeBuoy'),
    ('Workers', 'workers', 'Formal and informal labourers, minimum wage earners, and factory workers', 'HardHat'),
    ('SC/ST Communities', 'sc-st', 'Constitutional safeguards and Protection of Civil Rights', 'Users'),
    ('Tribal Communities', 'tribal', 'Forest Rights Act (FRA) and PESA community entitlements', 'Globe'),
    ('Consumers', 'consumers', 'Buyers of goods and services protected from unfair trade practices', 'ShoppingCart')
ON CONFLICT (name) DO UPDATE SET 
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- Right Categories
INSERT INTO right_categories (name, slug, description, icon) VALUES
    ('Constitutional Rights', 'constitutional', 'Fundamental rights, Article 21, equality, and constitutional remedies', 'Scale'),
    ('Labour Rights', 'labour', 'Employment, wages, safety, retrenchment, and overtime protections', 'Briefcase'),
    ('Women Rights', 'women', 'Protection of Women from Domestic Violence Act (PWDVA) and workplace safety', 'ShieldAlert'),
    ('Child Rights', 'children', 'Right of Children to Free and Compulsory Education (RTE) and POCSO', 'Baby'),
    ('Property Rights', 'property', 'Tenancy safeguards, land registration, and succession laws', 'Home'),
    ('Consumer Rights', 'consumer', 'Consumer Protection Act remedies, product liability, and refunds', 'ShoppingBag'),
    ('Criminal Law', 'criminal', 'Rights on arrest, 24-hr magistrate production, bail under BNSS and BNS', 'Gavel'),
    ('Disability Rights', 'disability', 'Rights of Persons with Disabilities Act (RPwD) 2016 provisions', 'Accessibility'),
    ('Senior Citizen Rights', 'senior-citizens', 'Maintenance and Welfare of Parents and Senior Citizens Act', 'HeartHandshake'),
    ('Tribal Rights', 'tribal', 'Forest Rights Act and Panchayats (Extension to Scheduled Areas) Act', 'Trees')
ON CONFLICT (name) DO UPDATE SET 
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- Legal Acts
INSERT INTO legal_acts (id, title, act_number, year, jurisdiction, state, category, description, source_url, status, verification_status, last_verified_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Payment of Wages Act, 1936', 'Act No. 4 of 1936', 1936, 'CENTRAL', NULL, 'LABOUR', 'Regulates timely payment of earned wages and prohibits unauthorized deductions from workers.', 'https://www.indiacode.nic.in/handle/123456789/2367', 'ACTIVE', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'Protection of Women from Domestic Violence Act, 2005', 'Act No. 43 of 2005', 2005, 'CENTRAL', NULL, 'WOMEN', 'Provides immediate protection, shelter, and maintenance for women experiencing abuse in shared households.', 'https://www.indiacode.nic.in/handle/123456789/2021', 'ACTIVE', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000003', 'Consumer Protection Act, 2019', 'Act No. 35 of 2019', 2019, 'CENTRAL', NULL, 'CONSUMER', 'Protects consumers from defective products, deficient services, misleading ads, and unfair contracts.', 'https://www.indiacode.nic.in/handle/123456789/15256', 'ACTIVE', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000004', 'Minimum Wages Act, 1948', 'Act No. 11 of 1948', 1948, 'CENTRAL', NULL, 'LABOUR', 'Mandates statutory minimum rates of wages in scheduled employments across States.', 'https://www.indiacode.nic.in/handle/123456789/2368', 'ACTIVE', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000005', 'Right of Children to Free and Compulsory Education Act, 2009', 'Act No. 35 of 2009', 2009, 'CENTRAL', NULL, 'CHILDREN', 'Guarantees free and compulsory elementary education to every child aged 6 to 14 years.', 'https://www.indiacode.nic.in/handle/123456789/2083', 'ACTIVE', 'VERIFIED', NOW())
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title, 
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    verification_status = 'VERIFIED';

-- Legal Sections
INSERT INTO legal_sections (id, act_id, section_number, section_title, original_text, simplified_text) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Section 5', 'Time of payment of wages', 
     'The wages of every person employed upon or in any railway, factory or industrial or other establishment upon or in which less than one thousand persons are employed, shall be paid before the expiry of the seventh day, and in other cases before the tenth day, after the last day of the wage-period.',
     'Your employer is required by law to pay your earned salary on or before the 7th of every month (or 10th if there are over 1000 employees). Withholding salary beyond this deadline is illegal.'),

    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Section 15', 'Claims arising out of deductions from wages or delay in payment',
     'Where contrary to the provisions of this Act any deduction has been made from the wages of an employed person, or any payment of wages has been delayed, such person himself, or any legal practitioner or any official of a registered trade union authorized in writing, may apply to such Authority for a direction under sub-section (3).',
     'If your wages are delayed or unlawfully withheld, you or your union can file an official compensation claim with the Labour Commissioner Authority to recover all back-pay plus statutory compensation up to 10 times the amount.'),

    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Section 3', 'Definition of domestic violence',
     'Any act, omission or commission or conduct of the respondent shall constitute domestic violence if it harms or injures or endangers the health, safety, life, limb or well-being, whether mental or physical, of the aggrieved person and includes causing physical abuse, sexual abuse, verbal and emotional abuse and economic abuse.',
     'Domestic violence includes physical harm, verbal abuse, insults, denial of food/money (economic abuse), or threats. You have the statutory right to live safely in the shared home without intimidation.'),

    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Section 12', 'Application to Magistrate',
     'An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act.',
     'You or a Protection Officer can file a direct petition before the Judicial Magistrate to immediately obtain restraining orders, monthly maintenance, and medical expenses without needing costly private lawyers.'),

    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Section 35', 'Complaint to District Commission',
     'A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by the consumer to whom such goods are sold or delivered.',
     'Any consumer who receives a defective product, expired goods, or fake warranty can file an online consumer complaint via the eDaakhil portal (edaakhil.nic.in) without hiring an advocate.')
ON CONFLICT (act_id, section_number) DO UPDATE SET simplified_text = EXCLUDED.simplified_text;

-- Section Beneficiaries
INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM beneficiaries WHERE slug = 'workers'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM beneficiaries WHERE slug = 'workers'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM beneficiaries WHERE slug = 'women'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM beneficiaries WHERE slug = 'women'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000005', id FROM beneficiaries WHERE slug = 'consumers'
ON CONFLICT DO NOTHING;

-- Section Categories
INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM right_categories WHERE slug = 'labour'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM right_categories WHERE slug = 'labour'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM right_categories WHERE slug = 'women'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM right_categories WHERE slug = 'women'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000005', id FROM right_categories WHERE slug = 'consumer'
ON CONFLICT DO NOTHING;

-- Complaint Workflows
INSERT INTO complaint_workflows (id, title, description, category, category_id, jurisdiction, target_authority, official_url)
SELECT 
    'c0000000-0000-0000-0000-000000000001',
    'Unpaid Salary Complaint',
    'Step-by-step statutory process for workers to recover unpaid wages or delayed salary under the Payment of Wages Act.',
    'LABOUR',
    id,
    'BOTH',
    'Labour Commissioner Office / DLSA',
    'https://shramsuvidha.gov.in'
FROM right_categories WHERE slug = 'labour'
ON CONFLICT (id) DO NOTHING;

-- Workflow Steps
INSERT INTO workflow_steps (workflow_id, step_number, title, instructions, description, required_documents, documents, official_url) VALUES
    ('c0000000-0000-0000-0000-000000000001', 1, 'Collect employment evidence',
     'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
     'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
     ARRAY['Salary slips', 'Bank Statements', 'Appointment Letter / ID card', 'WhatsApp/Email messages'],
     ARRAY['Salary slips', 'Bank Statements', 'Appointment Letter / ID card', 'WhatsApp/Email messages'],
     'https://shramsuvidha.gov.in'),

    ('c0000000-0000-0000-0000-000000000001', 2, 'Send written demand letter',
     'Send a formal demand letter by email or registered post giving the employer 7 to 15 days to disburse pending wages.',
     'Send a formal demand letter by email or registered post giving the employer 7 to 15 days to disburse pending wages.',
     ARRAY['Written Demand Letter', 'Postal/Email delivery receipt'],
     ARRAY['Written Demand Letter', 'Postal/Email delivery receipt'],
     NULL),

    ('c0000000-0000-0000-0000-000000000001', 3, 'Lodge grievance on Shram Suvidha portal',
     'File an online grievance on the Ministry of Labour portal (SAMADHAN / Shram Suvidha) for conciliation.',
     'File an online grievance on the Ministry of Labour portal (SAMADHAN / Shram Suvidha) for conciliation.',
     ARRAY['Demand letter copy', 'Salary proof'],
     ARRAY['Demand letter copy', 'Salary proof'],
     'https://shramsuvidha.gov.in'),

    ('c0000000-0000-0000-0000-000000000001', 4, 'File Section 15 claim before Labour Court / DLSA',
     'If conciliation fails, file a claim under Section 15 of Payment of Wages Act. Free DLSA representation is available.',
     'If conciliation fails, file a claim under Section 15 of Payment of Wages Act. Free DLSA representation is available.',
     ARRAY['Conciliation report', 'Affidavit of claim'],
     ARRAY['Conciliation report', 'Affidavit of claim'],
     'https://nalsa.gov.in')
ON CONFLICT (workflow_id, step_number) DO UPDATE SET 
    instructions = EXCLUDED.instructions,
    description = EXCLUDED.description;

-- Legal Aid Providers
INSERT INTO legal_aid_providers (id, name, provider_type, state, district, address, phone, email, website, eligibility_information, services, is_active, verified) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'National Legal Services Authority (NALSA)', 'NALSA', 'Delhi', 'New Delhi', 'B-Block, Additional Office Complex, Supreme Court of India, New Delhi - 110001', '15100', 'nalsa-dla@nic.in', 'https://nalsa.gov.in', 'All women, children, SC/ST, custody inmates, disabled, industrial workmen, and citizens with annual income below statutory limits.', ARRAY['Free Advocate in Court', 'Legal Advice', 'Lok Adalat dispute settlement', 'Prison legal aid'], TRUE, TRUE),
    ('d0000000-0000-0000-0000-000000000002', 'Maharashtra State Legal Services Authority (MSLSA)', 'SLSA', 'Maharashtra', 'Mumbai', 'High Court PWD Building, Fort, Mumbai - 400032', '022-22691395', 'mslsa-hc@nic.in', 'https://legalservices.maharashtra.gov.in', 'Maharashtra residents meeting Section 12 criteria or annual income below ₹3,00,000.', ARRAY['DLSA referral', 'Panel advocate appointment', 'Pre-litigation mediation'], TRUE, TRUE),
    ('d0000000-0000-0000-0000-000000000003', 'Delhi State Legal Services Authority (DSLSA)', 'SLSA', 'Delhi', 'Central', 'Central Office, Patiala House Courts Complex, New Delhi - 110001', '1516', 'dslsa-phc@nic.in', 'https://dslsa.org', 'Delhi residents with income below ₹3,00,000 or falling in protected classes under Section 12.', ARRAY['Front office legal clinics', 'Free legal representation', 'Victim compensation scheme'], TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    provider_type = EXCLUDED.provider_type,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    eligibility_information = EXCLUDED.eligibility_information,
    services = EXCLUDED.services,
    is_active = EXCLUDED.is_active,
    verified = EXCLUDED.verified;

-- ============================================================================
-- STEP 9: Force PostgREST to Reload Schema Cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
