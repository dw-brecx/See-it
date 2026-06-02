-- ============================================================
-- SeeIt admin — Phase 5: integrations registry
-- ============================================================
-- A single row per provider (stripe, resend, twilio, etc.) that
-- holds the on/off flag plus a jsonb blob of provider-specific
-- config (API keys, webhook secrets, account ids, etc).
--
-- Admin-only RLS. Keys are stored in plaintext jsonb — for
-- production, layer Supabase Vault on top or move secrets to
-- Vercel env vars and have this table only track which providers
-- are enabled.
-- ============================================================

create table if not exists public.integrations (
  id           uuid primary key default uuid_generate_v4(),
  provider     text not null unique,                  -- 'stripe', 'resend', etc.
  is_enabled   boolean not null default false,
  config       jsonb not null default '{}',           -- API keys, webhook secrets, ...
  last_tested_at timestamptz,
  last_test_ok   boolean,
  last_test_message text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists integrations_provider_idx on public.integrations(provider);
create index if not exists integrations_enabled_idx  on public.integrations(is_enabled);

drop trigger if exists trg_integrations_updated_at on public.integrations;
create trigger trg_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;

drop policy if exists "admins full access" on public.integrations;
create policy "admins full access" on public.integrations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
