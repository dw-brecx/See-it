-- 006_halal_and_verification.sql
--
-- Adds:
--   1. halal_certifications table (mirrors kosher_certifications shape)
--   2. brand verification columns (is_verified, status, requested_at, etc.)
--
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.

-- ──────────────────────────────────────────────────────────────────
-- 1. Halal certifications
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.halal_certifications (
  location_id uuid PRIMARY KEY REFERENCES public.locations(id) ON DELETE CASCADE,
  agency text NOT NULL,
  agency_other text,
  certificate_image_url text,
  expiration_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.halal_certifications ENABLE ROW LEVEL SECURITY;

-- Admins: full access
DROP POLICY IF EXISTS halal_admin_all ON public.halal_certifications;
CREATE POLICY halal_admin_all ON public.halal_certifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Owners + team members: read/write their own brand's halal certs
DROP POLICY IF EXISTS halal_owner_select ON public.halal_certifications;
CREATE POLICY halal_owner_select ON public.halal_certifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.locations l
      JOIN public.brands b ON b.id = l.brand_id
      WHERE l.id = halal_certifications.location_id
        AND (b.owner_id = auth.uid()
             OR EXISTS (
               SELECT 1 FROM public.team_members tm
               WHERE tm.brand_id = b.id AND tm.user_id = auth.uid()
             ))
    )
  );

DROP POLICY IF EXISTS halal_owner_write ON public.halal_certifications;
CREATE POLICY halal_owner_write ON public.halal_certifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.locations l
      JOIN public.brands b ON b.id = l.brand_id
      WHERE l.id = halal_certifications.location_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.locations l
      JOIN public.brands b ON b.id = l.brand_id
      WHERE l.id = halal_certifications.location_id
        AND b.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- 2. Brand verification columns
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text
    CHECK (verification_status IS NULL OR verification_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_notes text;

CREATE INDEX IF NOT EXISTS idx_brands_verification_status
  ON public.brands(verification_status)
  WHERE verification_status IS NOT NULL;
