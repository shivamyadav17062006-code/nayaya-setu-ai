-- ============================================================================
-- NyayaSaathi (न्यायसाथी) — Supabase PostgreSQL + pgvector Database Schema
-- Digital Assistant for Legal Awareness & Know Your Rights (KYR) Framework - India
-- ============================================================================

-- ============================================================================
-- STEP 3: Enable pgvector Extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 4: Core Tables
-- ============================================================================

-- 4.1 Legal Acts Table
CREATE TABLE IF NOT EXISTS legal_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    act_number TEXT,
    year INT NOT NULL,
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('CENTRAL', 'STATE')),
    state TEXT,
    description TEXT,
    source_url TEXT NOT NULL,
    effective_from DATE,
    effective_to DATE,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'NEEDS_REVIEW')),
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Legal Sections Table
CREATE TABLE IF NOT EXISTS legal_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id UUID NOT NULL REFERENCES legal_acts(id) ON DELETE CASCADE,
    section_number TEXT NOT NULL,
    section_title TEXT,
    original_text TEXT NOT NULL,
    simplified_text TEXT,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (act_id, section_number)
);

-- 4.3 Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Right Categories Table
CREATE TABLE IF NOT EXISTS right_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 Section Beneficiaries (Many-to-Many)
CREATE TABLE IF NOT EXISTS section_beneficiaries (
    section_id UUID REFERENCES legal_sections(id) ON DELETE CASCADE,
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    PRIMARY KEY (section_id, beneficiary_id)
);

-- 4.6 Section Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS section_categories (
    section_id UUID REFERENCES legal_sections(id) ON DELETE CASCADE,
    category_id UUID REFERENCES right_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (section_id, category_id)
);

-- ============================================================================
-- STEP 5: Complaint Workflows & Steps
-- ============================================================================

-- 5.1 Complaint Workflows Table
CREATE TABLE IF NOT EXISTS complaint_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES right_categories(id),
    jurisdiction TEXT DEFAULT 'BOTH' CHECK (jurisdiction IN ('CENTRAL', 'STATE', 'BOTH')),
    state TEXT,
    target_authority TEXT,
    official_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES complaint_workflows(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    required_documents TEXT[],
    official_url TEXT,
    UNIQUE (workflow_id, step_number)
);

-- ============================================================================
-- STEP 6: Legal Aid Providers (NALSA, SLSA, DLSA)
-- ============================================================================
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
    verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: AI Legal Chunks with pgvector (384 Dimensions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES legal_sections(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_number INT NOT NULL DEFAULT 1,
    language TEXT DEFAULT 'en',
    source_url TEXT,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 HNSW Vector Index for Semantic Search
CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx 
ON legal_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 7.4 Vector Similarity Match Function (for RAG Retrieval)
CREATE OR REPLACE FUNCTION match_legal_chunks (
    query_embedding vector(384),
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    section_id UUID,
    source_url TEXT,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        lc.id,
        lc.content,
        lc.section_id,
        lc.source_url,
        1 - (lc.embedding <=> query_embedding) AS similarity
    FROM legal_chunks lc
    WHERE lc.embedding IS NOT NULL
    ORDER BY lc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================================================
-- STEP 8: Row Level Security (RLS) & Access Policies
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
ALTER TABLE legal_chunks ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Public can read legal chunks" ON legal_chunks;

-- Read policies for public & authenticated users
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
USING (verified = true);

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

-- Grant Read Access to public API roles
GRANT SELECT ON legal_acts, legal_sections, beneficiaries, right_categories, 
section_beneficiaries, section_categories, complaint_workflows, 
workflow_steps, legal_aid_providers, legal_chunks TO anon, authenticated;

-- Service Role (Backend) has full read/write access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 9: Verified Initial Indian Legal Seed Data
-- ============================================================================

-- Insert Beneficiaries
INSERT INTO beneficiaries (name, description) VALUES
    ('Women', 'Women and their legal protections against domestic violence and workplace harassment'),
    ('Children', 'Children, child education rights and POCSO protections'),
    ('Senior Citizens', 'Rights, maintenance, and welfare of elderly citizens'),
    ('Persons with Disabilities', 'Equal opportunity and accessibility rights under RPwD Act 2016'),
    ('Workers', 'Formal and informal labourers, minimum wage earners, and factory workers'),
    ('SC/ST Communities', 'Constitutional safeguards and Protection of Civil Rights'),
    ('Tribal Communities', 'Forest Rights Act (FRA) and PESA community entitlements'),
    ('Consumers', 'Buyers of goods and services protected from unfair trade practices')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Insert Right Categories
INSERT INTO right_categories (name, description) VALUES
    ('Constitutional Rights', 'Fundamental rights, Article 21, equality, and constitutional remedies'),
    ('Labour Rights', 'Employment, wages, safety, retrenchment, and overtime protections'),
    ('Women Rights', 'Protection of Women from Domestic Violence Act (PWDVA) and workplace safety'),
    ('Child Rights', 'Right of Children to Free and Compulsory Education (RTE) and POCSO'),
    ('Property Rights', 'Tenancy safeguards, land registration, and succession laws'),
    ('Consumer Rights', 'Consumer Protection Act remedies, product liability, and refunds'),
    ('Criminal Law', 'Rights on arrest, 24-hr magistrate production, bail under BNSS and BNS'),
    ('Disability Rights', 'Rights of Persons with Disabilities Act (RPwD) 2016 provisions'),
    ('Senior Citizen Rights', 'Maintenance and Welfare of Parents and Senior Citizens Act'),
    ('Tribal Rights', 'Forest Rights Act and Panchayats (Extension to Scheduled Areas) Act')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Insert Legal Acts
INSERT INTO legal_acts (id, title, act_number, year, jurisdiction, state, description, source_url, verification_status, last_verified_at) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Payment of Wages Act, 1936', 'Act No. 4 of 1936', 1936, 'CENTRAL', NULL, 'Regulates timely payment of earned wages and prohibits unauthorized deductions from workers.', 'https://www.indiacode.nic.in/handle/123456789/2367', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'Protection of Women from Domestic Violence Act, 2005', 'Act No. 43 of 2005', 2005, 'CENTRAL', NULL, 'Provides immediate protection, shelter, and maintenance for women experiencing abuse in shared households.', 'https://www.indiacode.nic.in/handle/123456789/2021', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000003', 'Consumer Protection Act, 2019', 'Act No. 35 of 2019', 2019, 'CENTRAL', NULL, 'Protects consumers from defective products, deficient services, misleading ads, and unfair contracts.', 'https://www.indiacode.nic.in/handle/123456789/15256', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000004', 'Minimum Wages Act, 1948', 'Act No. 11 of 1948', 1948, 'CENTRAL', NULL, 'Mandates statutory minimum rates of wages in scheduled employments across States.', 'https://www.indiacode.nic.in/handle/123456789/2368', 'VERIFIED', NOW()),
    ('a0000000-0000-0000-0000-000000000005', 'Right of Children to Free and Compulsory Education Act, 2009', 'Act No. 35 of 2009', 2009, 'CENTRAL', NULL, 'Guarantees free and compulsory elementary education to every child aged 6 to 14 years.', 'https://www.indiacode.nic.in/handle/123456789/2083', 'VERIFIED', NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, verification_status = 'VERIFIED';

-- Insert Legal Sections
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

-- Connect Sections to Beneficiaries
INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM beneficiaries WHERE name = 'Workers'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM beneficiaries WHERE name = 'Workers'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM beneficiaries WHERE name = 'Women'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM beneficiaries WHERE name = 'Women'
ON CONFLICT DO NOTHING;

INSERT INTO section_beneficiaries (section_id, beneficiary_id)
SELECT 'b0000000-0000-0000-0000-000000000005', id FROM beneficiaries WHERE name = 'Consumers'
ON CONFLICT DO NOTHING;

-- Connect Sections to Categories
INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM right_categories WHERE name = 'Labour Rights'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM right_categories WHERE name = 'Labour Rights'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM right_categories WHERE name = 'Women Rights'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM right_categories WHERE name = 'Women Rights'
ON CONFLICT DO NOTHING;

INSERT INTO section_categories (section_id, category_id)
SELECT 'b0000000-0000-0000-0000-000000000005', id FROM right_categories WHERE name = 'Consumer Rights'
ON CONFLICT DO NOTHING;

-- Insert Workflows
INSERT INTO complaint_workflows (id, title, description, category_id, jurisdiction, target_authority, official_url)
SELECT 
    'c0000000-0000-0000-0000-000000000001',
    'Unpaid Salary Complaint',
    'Step-by-step statutory process for workers to recover unpaid wages or delayed salary under the Payment of Wages Act.',
    id,
    'BOTH',
    'Labour Commissioner Office / DLSA',
    'https://shramsuvidha.gov.in'
FROM right_categories WHERE name = 'Labour Rights'
ON CONFLICT (id) DO NOTHING;

-- Insert Workflow Steps
INSERT INTO workflow_steps (workflow_id, step_number, title, instructions, required_documents, official_url) VALUES
    ('c0000000-0000-0000-0000-000000000001', 1, 'Collect employment evidence',
     'Assemble offer letter, salary slips, bank transaction records, WhatsApp chats, or muster roll logs showing worked hours.',
     ARRAY['Salary slips', 'Bank Statements', 'Appointment Letter / ID card', 'WhatsApp/Email messages'],
     'https://shramsuvidha.gov.in'),

    ('c0000000-0000-0000-0000-000000000001', 2, 'Send written demand letter',
     'Send a formal demand letter by email or registered post giving the employer 7 to 15 days to disburse pending wages.',
     ARRAY['Written Demand Letter', 'Postal/Email delivery receipt'],
     NULL),

    ('c0000000-0000-0000-0000-000000000001', 3, 'Lodge grievance on Shram Suvidha portal',
     'File an online grievance on the Ministry of Labour portal (SAMADHAN / Shram Suvidha) for conciliation.',
     ARRAY['Demand letter copy', 'Salary proof'],
     'https://shramsuvidha.gov.in'),

    ('c0000000-0000-0000-0000-000000000001', 4, 'File Section 15 claim before Labour Court / DLSA',
     'If conciliation fails, file a claim under Section 15 of Payment of Wages Act. Free DLSA representation is available.',
     ARRAY['Conciliation report', 'Affidavit of claim'],
     'https://nalsa.gov.in')
ON CONFLICT (workflow_id, step_number) DO UPDATE SET instructions = EXCLUDED.instructions;

-- Insert Legal Aid Providers
INSERT INTO legal_aid_providers (name, provider_type, state, district, address, phone, email, website, eligibility_information, verified) VALUES
    ('National Legal Services Authority (NALSA)', 'NALSA', 'Delhi', 'New Delhi', 'B-Block, Additional Office Complex, Supreme Court of India, New Delhi - 110001', '15100', 'nalsa-dla@nic.in', 'https://nalsa.gov.in', 'All women, children, SC/ST, custody inmates, disabled, industrial workmen, and citizens with annual income below statutory limits.', TRUE),
    ('Maharashtra State Legal Services Authority (MSLSA)', 'SLSA', 'Maharashtra', 'Mumbai', 'High Court PWD Building, Fort, Mumbai - 400032', '022-22691395', 'mslsa-hc@nic.in', 'https://legalservices.maharashtra.gov.in', 'Maharashtra residents meeting Section 12 criteria or annual income below ₹3,00,000.', TRUE),
    ('Delhi State Legal Services Authority (DSLSA)', 'SLSA', 'Delhi', 'Central', 'Central Office, Patiala House Courts Complex, New Delhi - 110001', '1516', 'dslsa-phc@nic.in', 'https://dslsa.org', 'Delhi residents with income below ₹3,00,000 or falling in protected classes under Section 12.', TRUE)
ON CONFLICT DO NOTHING;
