-- ============================================================
-- SeeIt admin — Phase 2: plans + discount codes
-- ============================================================
-- Run this once in your Supabase SQL editor BEFORE deploying
-- the Settings page that depends on these tables.
--
-- Both tables get an `updated_at` trigger that mirrors the one
-- you already have on other tables in the schema. If your existing
-- trigger fn has a different name, swap the function name below.
-- ============================================================

-- ---------- helper trigger fn (no-op if it already exists) -------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- plans
-- ============================================================
create table if not exists public.plans (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  price_cents     integer not null default 0,
  billing_interval text not null default 'month'
                  check (billing_interval in ('month', 'year')),
  location_limit  integer,                        -- null = unlimited
  features        jsonb not null default '[]'::jsonb, -- array of strings
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
-- discount_codes
-- ============================================================
create table if not exists public.discount_codes (
  id                  uuid primary key default uuid_generate_v4(),
  code                text not null unique,
  description         text,
  -- exactly one of percent_off / amount_off_cents should be set
  percent_off         integer check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_cents    integer check (amount_off_cents is null or amount_off_cents > 0),
  valid_from          timestamptz default now(),
  valid_until         timestamptz,
  max_uses            integer,                    -- null = unlimited
  used_count          integer not null default 0,
  applies_to_plan_id  uuid references public.plans(id) on delete set null,
  is_active           boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  -- exactly one discount type must be set
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
-- brands.plan_id (optional FK so brands can be assigned to a plan)
-- ============================================================
alter table public.brands
  add column if not exists plan_id uuid references public.plans(id) on delete set null;

create index if not exists brands_plan_idx on public.brands(plan_id);

-- ============================================================
-- RLS — admin-only access for both tables
-- ============================================================
alter table public.plans enable row level security;
alter table public.discount_codes enable row level security;

drop policy if exists "admins read plans" on public.plans;
create policy "admins read plans" on public.plans for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins write plans" on public.plans;
create policy "admins write plans" on public.plans for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins read codes" on public.discount_codes;
create policy "admins read codes" on public.discount_codes for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins write codes" on public.discount_codes;
create policy "admins write codes" on public.discount_codes for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- Seed three starter plans
-- ============================================================
insert into public.plans (name, slug, price_cents, billing_interval, location_limit, features, display_order)
values
  ('Starter', 'starter', 0,    'month', 1,   '["1 location","Basic menu management","Customer reviews"]'::jsonb, 1),
  ('Pro',     'pro',     4900, 'month', 5,   '["Up to 5 locations","Priority support","Custom branding","Photo moderation"]'::jsonb, 2),
  ('Premium', 'premium', 14900,'month', null,'["Unlimited locations","Dedicated account manager","API access","Custom integrations"]'::jsonb, 3)
on conflict (slug) do nothing;
