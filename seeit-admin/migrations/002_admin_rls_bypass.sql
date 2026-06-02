-- ============================================================
-- SeeIt admin — Phase 2.5: admin RLS bypass + schema reload
-- ============================================================
-- Run this after 001_plans_and_discount_codes.sql.
--
-- Fixes two classes of errors the admin app hits in production:
--
--   1. "Could not find the table 'public.plans' in the schema cache"
--      → PostgREST caches the table list. After a CREATE TABLE it
--        doesn't refresh until something kicks it. NOTIFY does that.
--
--   2. "new row violates row-level security policy for table X"
--      → Your customer-facing policies (e.g. reviews.user_id = auth.uid())
--        block the admin from acting on behalf of others. We add a
--        SECOND policy on each table that lets users with role='admin'
--        do anything — your existing customer policies stay intact.
--
-- The migration is idempotent: re-running it is safe.
-- ============================================================

-- ----------------------------------------------------------------------
-- Helper: is the current request from a user with role='admin'?
-- security definer so it runs as the table owner and can read users.role
-- regardless of the caller's own RLS on the users table.
-- ----------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon, service_role;

-- ----------------------------------------------------------------------
-- Apply "admins full access" to every table the admin dashboard writes to.
-- Existing customer-facing policies stay in place — admins just get an
-- ADDITIONAL ALL policy. RLS treats multiple policies as OR.
-- ----------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'brands',
    'locations',
    'kosher_certifications',
    'menu_categories',
    'menu_items',
    'menu_item_photos',
    'reviews',
    'review_photos',
    'review_replies',
    'users',
    'user_preferences',
    'team_members',
    'subscriptions',
    'notifications',
    'qr_codes',
    'saved_items',
    'order_lists',
    'order_list_items'
  ];
begin
  foreach tbl in array tables loop
    -- Make sure RLS is enabled (no-op if it already is)
    execute format('alter table public.%I enable row level security', tbl);

    -- Recreate the admin policy. Drop first so the migration is idempotent
    -- and we can tweak the predicate later without manual cleanup.
    execute format('drop policy if exists "admins full access" on public.%I', tbl);
    execute format(
      'create policy "admins full access" on public.%I '
      || 'for all to authenticated '
      || 'using (public.is_admin()) '
      || 'with check (public.is_admin())',
      tbl
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------
-- Re-create the plans + discount_codes admin policies using the new
-- is_admin() helper. (The originals from 001_... still work, but this
-- standardizes them on the same function.)
-- ----------------------------------------------------------------------
do $$
begin
  if to_regclass('public.plans') is not null then
    execute 'alter table public.plans enable row level security';
    execute 'drop policy if exists "admins read plans" on public.plans';
    execute 'drop policy if exists "admins write plans" on public.plans';
    execute 'drop policy if exists "admins full access" on public.plans';
    execute 'create policy "admins full access" on public.plans '
      || 'for all to authenticated '
      || 'using (public.is_admin()) with check (public.is_admin())';
  end if;
  if to_regclass('public.discount_codes') is not null then
    execute 'alter table public.discount_codes enable row level security';
    execute 'drop policy if exists "admins read codes" on public.discount_codes';
    execute 'drop policy if exists "admins write codes" on public.discount_codes';
    execute 'drop policy if exists "admins full access" on public.discount_codes';
    execute 'create policy "admins full access" on public.discount_codes '
      || 'for all to authenticated '
      || 'using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

-- ----------------------------------------------------------------------
-- Tell PostgREST (Supabase's REST API layer) to reload its schema cache
-- so newly created tables become visible to the API immediately.
-- ----------------------------------------------------------------------
notify pgrst, 'reload schema';
