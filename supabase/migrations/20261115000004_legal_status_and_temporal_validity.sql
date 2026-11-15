-- ============================================================================
-- Migration: 20261115000004_legal_status_and_temporal_validity.sql
-- Description: Non-destructive schema extension for NyayaSaathi
-- Implements the 14-State Legal Lifecycle, Temporal Validity, and Savings Tracking.
-- ============================================================================

-- 1. Extend legal_acts table with temporal validity and commencement tracking
ALTER TABLE legal_acts
  ADD COLUMN IF NOT EXISTS assent_date DATE,
  ADD COLUMN IF NOT EXISTS gazette_number VARCHAR(128),
  ADD COLUMN IF NOT EXISTS gazette_date DATE,
  ADD COLUMN IF NOT EXISTS commencement_date DATE,
  ADD COLUMN IF NOT EXISTS repeal_date DATE,
  ADD COLUMN IF NOT EXISTS repealed_by_act_id UUID REFERENCES legal_acts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS savings_clause_ref TEXT,
  ADD COLUMN IF NOT EXISTS is_partially_commenced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commenced_sections TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS staged_sections TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Extend legal_sections table with section-level lifecycle status and savings notes
ALTER TABLE legal_sections
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'IN_FORCE',
  ADD COLUMN IF NOT EXISTS amendment_act_ref TEXT,
  ADD COLUMN IF NOT EXISTS savings_clause_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_operative BOOLEAN DEFAULT true;

-- 3. Extend legal_chunks table with temporal query metadata for version-aware RAG
ALTER TABLE legal_chunks
  ADD COLUMN IF NOT EXISTS legal_status VARCHAR(32) DEFAULT 'IN_FORCE',
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE,
  ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(32) DEFAULT 'CENTRAL',
  ADD COLUMN IF NOT EXISTS act_title TEXT,
  ADD COLUMN IF NOT EXISTS section_number VARCHAR(64);

-- 4. Create performance indexes for temporal and status filtering
CREATE INDEX IF NOT EXISTS idx_legal_acts_status ON legal_acts(status);
CREATE INDEX IF NOT EXISTS idx_legal_acts_commencement ON legal_acts(commencement_date);
CREATE INDEX IF NOT EXISTS idx_legal_sections_status ON legal_sections(status);
CREATE INDEX IF NOT EXISTS idx_legal_sections_operative ON legal_sections(is_operative);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_status_jurisdiction ON legal_chunks(legal_status, jurisdiction);
