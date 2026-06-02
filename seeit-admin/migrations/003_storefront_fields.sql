-- ============================================================
-- SeeIt admin — Phase 3: storefront profile fields on brands
-- ============================================================
-- Adds customizable storefront fields that the customer app and
-- restaurant dashboard will render as a public store profile page.
--
-- Run after 000_setup_all.sql. Idempotent — safe to re-run.
-- ============================================================

alter table public.brands
  add column if not exists tagline text,
  add column if not exists cover_photo_url text,
  add column if not exists story text,
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists facebook_url text,
  add column if not exists x_url text,                        -- Twitter / X
  add column if not exists theme_color text,                  -- hex, e.g. '#E85D3A'
  add column if not exists featured_menu_item_ids uuid[] not null default '{}',
  add column if not exists storefront_published boolean not null default true;

-- Optional sanity check on theme_color format: ignore null + empty,
-- otherwise require '#' + 3 or 6 hex chars.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brands_theme_color_format'
  ) then
    alter table public.brands
      add constraint brands_theme_color_format
      check (
        theme_color is null
        or theme_color ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$'
      );
  end if;
end $$;

-- Tell PostgREST about the new columns
notify pgrst, 'reload schema';
