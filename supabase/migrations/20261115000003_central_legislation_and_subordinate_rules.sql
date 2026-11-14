-- Migration: 20261115000003_central_legislation_and_subordinate_rules.sql
-- Description: Adds subordinate legislation metadata, parent act linkage, and lifecycle tracking to legal_acts.

ALTER TABLE public.legal_acts 
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'ACT',
  ADD COLUMN IF NOT EXISTS parent_act_id uuid REFERENCES public.legal_acts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ministry text,
  ADD COLUMN IF NOT EXISTS checksum text,
  ADD COLUMN IF NOT EXISTS enactment_date date,
  ADD COLUMN IF NOT EXISTS enabling_provision text;

CREATE INDEX IF NOT EXISTS idx_legal_acts_parent_act_id ON public.legal_acts(parent_act_id);
CREATE INDEX IF NOT EXISTS idx_legal_acts_document_type ON public.legal_acts(document_type);

ALTER TABLE public.legal_acts DROP CONSTRAINT IF EXISTS legal_acts_verification_status_check;
ALTER TABLE public.legal_acts ADD CONSTRAINT legal_acts_verification_status_check 
  CHECK (verification_status = ANY (ARRAY['IMPORTED'::text, 'EXTRACTION_COMPLETE'::text, 'AWAITING_REVIEW'::text, 'PENDING'::text, 'NEEDS_REVIEW'::text, 'VERIFIED'::text, 'PUBLISHED'::text, 'SUPERSEDED'::text, 'REJECTED'::text]));

ALTER POLICY "Public can read legal acts" ON public.legal_acts 
  USING (verification_status IN ('VERIFIED', 'PUBLISHED'));

ALTER POLICY "Public can read legal sections" ON public.legal_sections 
  USING (EXISTS (
    SELECT 1 FROM legal_acts 
    WHERE legal_acts.id = legal_sections.act_id 
      AND legal_acts.verification_status IN ('VERIFIED', 'PUBLISHED')
  ));

ALTER POLICY "Public can read legal chunks" ON public.legal_chunks 
  USING (EXISTS (
    SELECT 1 FROM legal_sections s 
    JOIN legal_acts a ON a.id = s.act_id 
    WHERE s.id = legal_chunks.section_id 
      AND a.verification_status IN ('VERIFIED', 'PUBLISHED')
  ));


