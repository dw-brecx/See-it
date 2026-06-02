-- ============================================================
-- SeeIt admin — combined setup migration (001 + 002)
-- ============================================================
-- This is the only SQL you need to run.
-- It's idempotent — safe to paste and run multiple times.
--
-- Does three things:
--   1. Creates `plans` and `discount_codes` tables
--   2. Grants admins full access to all admin-managed tables
--   3. Forces PostgREST to reload its schema cache so the new
--      tables show up in the API immediately
-- ============================================================

-- ---------- updated_at trigger helper (no-op if it exists) ------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 1. plans table
-- ============================================================
create table if not exists public.plans (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  price_cents     integer not null default 0,
  billing_interval text not null default 'month'
                  check (billing_interval in ('month', 'year')),
  location_limit  integer,
  features        jsonb not null default '[]'::jsonb,
  is_active       boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists plans_active_idx on public.plans(is_active);
create index if not exists plans_order_idx on public.plans(display_order);

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. discount_codes table
-- ============================================================
create table if not exists public.discount_codes (
  id                  uuid primary key default uuid_generate_v4(),
  code                text not null unique,
  description         text,
  percent_off         integer check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_cents    integer check (amount_off_cents is null or amount_off_cents > 0),
  valid_from          timestamptz default now(),
  valid_until         timestamptz,
  max_uses            integer,
  used_count          integer not null default 0,
  applies_to_plan_id  uuid references public.plans(id) on delete set null,
  is_active           boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  constraint exactly_one_discount_kind check (
    (percent_off is not null and amount_off_cents is null) or
    (percent_off is null and amount_off_cents is not null)
  )
);

create index if not exists discount_codes_code_idx on public.discount_codes(code);
create index if not exists discount_codes_active_idx on public.discount_codes(is_active);

drop trigger if exists trg_discount_codes_updated_at on public.discount_codes;
create trigger trg_discount_codes_updated_at
  before update on public.discount_codes
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. brands.plan_id (optional FK so brands can be assigned to a plan)
-- ============================================================
alter table public.brands
  add column if not exists plan_id uuid references public.plans(id) on delete set null;

create index if not exists brands_plan_idx on public.brands(plan_id);

-- ============================================================
-- 4. is_admin() helper
-- ============================================================
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

-- ============================================================
-- 5. "admins full access" RLS policy on every admin-managed table
-- ============================================================
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
    'order_list_items',
    'plans',
    'discount_codes'
  ];
begin
  foreach tbl in array tables loop
    -- skip tables that don't exist (e.g. future tables)
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    execute format('alter table public.%I enable row level security', tbl);
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

-- ============================================================
-- 6. Seed three starter plans (idempotent — uses ON CONFLICT)
-- ============================================================
insert into public.plans (name, slug, price_cents, billing_interval, location_limit, features, display_order)
values
  ('Starter', 'starter', 0,    'month', 1,   '["1 location","Basic menu management","Customer reviews"]'::jsonb, 1),
  ('Pro',     'pro',     4900, 'month', 5,   '["Up to 5 locations","Priority support","Custom branding","Photo moderation"]'::jsonb, 2),
  ('Premium', 'premium', 14900,'month', null,'["Unlimited locations","Dedicated account manager","API access","Custom integrations"]'::jsonb, 3)
on conflict (slug) do nothing;

-- ============================================================
-- 7. Force PostgREST schema-cache reload so the new tables
--    show up in the REST API immediately.
-- ============================================================
notify pgrst, 'reload schema';
