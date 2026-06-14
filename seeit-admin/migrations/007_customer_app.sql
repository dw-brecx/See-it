-- 007_customer_app.sql
-- Schema + storage changes required by the customer app v0.2.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────
-- 1) saved_items.is_want_to_try — distinguish "saved" from "want to try"
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.saved_items
  ADD COLUMN IF NOT EXISTS is_want_to_try boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_saved_items_user_want
  ON public.saved_items(user_id, is_want_to_try)
  WHERE is_want_to_try = true;

-- ─────────────────────────────────────────────────────────────────────
-- 2) review-photos storage bucket — uploads from the write-review form
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into a folder matching their auth.uid.
DROP POLICY IF EXISTS "auth users insert review photos" ON storage.objects;
CREATE POLICY "auth users insert review photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read review photos (they're public UGC on the storefront).
DROP POLICY IF EXISTS "public read review photos" ON storage.objects;
CREATE POLICY "public read review photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'review-photos');

-- Users can delete their own review photos.
DROP POLICY IF EXISTS "owners delete review photos" ON storage.objects;
CREATE POLICY "owners delete review photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────
-- 3) Public-read RLS policies the customer app needs (anon SELECT)
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- brands
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'brands' AND policyname = 'Anon read brands'
  ) THEN
    CREATE POLICY "Anon read brands" ON public.brands
      FOR SELECT TO anon USING (true);
  END IF;

  -- locations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Anon read locations'
  ) THEN
    CREATE POLICY "Anon read locations" ON public.locations
      FOR SELECT TO anon USING (true);
  END IF;

  -- menu_categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'menu_categories' AND policyname = 'Anon read menu_categories'
  ) THEN
    CREATE POLICY "Anon read menu_categories" ON public.menu_categories
      FOR SELECT TO anon USING (true);
  END IF;

  -- menu_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'Anon read menu_items'
  ) THEN
    CREATE POLICY "Anon read menu_items" ON public.menu_items
      FOR SELECT TO anon USING (true);
  END IF;

  -- menu_item_photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'menu_item_photos' AND policyname = 'Anon read menu_item_photos'
  ) THEN
    CREATE POLICY "Anon read menu_item_photos" ON public.menu_item_photos
      FOR SELECT TO anon USING (true);
  END IF;

  -- reviews
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Anon read reviews'
  ) THEN
    CREATE POLICY "Anon read reviews" ON public.reviews
      FOR SELECT TO anon USING (true);
  END IF;

  -- review_photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_photos' AND policyname = 'Anon read review_photos'
  ) THEN
    CREATE POLICY "Anon read review_photos" ON public.review_photos
      FOR SELECT TO anon USING (true);
  END IF;

  -- review_replies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_replies' AND policyname = 'Anon read review_replies'
  ) THEN
    CREATE POLICY "Anon read review_replies" ON public.review_replies
      FOR SELECT TO anon USING (true);
  END IF;

  -- kosher_certifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kosher_certifications' AND policyname = 'Anon read kosher_certifications'
  ) THEN
    CREATE POLICY "Anon read kosher_certifications" ON public.kosher_certifications
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- halal_certifications — separate DO block because table might not exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'halal_certifications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'halal_certifications' AND policyname = 'Anon read halal_certifications'
    ) THEN
      EXECUTE 'CREATE POLICY "Anon read halal_certifications" ON public.halal_certifications FOR SELECT TO anon USING (true)';
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
