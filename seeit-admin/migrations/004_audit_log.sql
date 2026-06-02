-- ============================================================
-- SeeIt admin — Phase 4: admin audit log
-- ============================================================
-- Records every important admin action: deletes, suspends, role
-- changes, plan assignments, storefront edits. Surfaced on the
-- Activity page so the team can see who did what when.
--
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists public.admin_audit_log (
  id            uuid primary key default uuid_generate_v4(),
  actor_id     uuid references public.users(id) on delete set null,
  action       text not null,                -- e.g. 'delete', 'suspend', 'create', 'update'
  target_type  text not null,                -- e.g. 'brand', 'location', 'user', 'review', 'plan'
  target_id    uuid,
  target_label text,                         -- human-readable, e.g. brand name
  metadata     jsonb not null default '{}',  -- free-form context (count, before/after, etc.)
  created_at   timestamptz not null default now()
);

create index if not exists audit_actor_idx     on public.admin_audit_log(actor_id);
create index if not exists audit_target_idx    on public.admin_audit_log(target_type, target_id);
create index if not exists audit_created_idx   on public.admin_audit_log(created_at desc);

-- ----------------------------------------------------------------------
-- RLS: only admins read; only authenticated admins write (actor_id
-- defaults to auth.uid() on insert).
-- ----------------------------------------------------------------------
alter table public.admin_audit_log enable row level security;

drop policy if exists "admins read audit"  on public.admin_audit_log;
drop policy if exists "admins write audit" on public.admin_audit_log;

create policy "admins read audit" on public.admin_audit_log
  for select to authenticated using (public.is_admin());

create policy "admins write audit" on public.admin_audit_log
  for insert to authenticated with check (public.is_admin());

-- Default actor to the current auth user if the client doesn't supply one
alter table public.admin_audit_log
  alter column actor_id set default auth.uid();

notify pgrst, 'reload schema';
