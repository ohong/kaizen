-- Migration: Create integrations table with secure secret storage via Vault
-- Created: 2025-10-06

-- Ensure required extensions exist (Vault is already available, but guard just in case)
do $$
begin
  perform 1 from pg_extension where extname = 'supabase_vault';
  if not found then
    create extension if not exists supabase_vault with schema vault;
  end if;
end$$;

-- Create enum for integration types if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type t where t.typname = 'integration_type') then
    create type integration_type as enum ('github', 'datadog', 'linear', 'sentry', 'slack');
  end if;
end$$;

-- Create integrations table
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  type integration_type not null,
  -- Optional display name to distinguish multiple integrations of the same type per repo
  name text,
  status text not null default 'active' check (status in ('active','inactive','error')),
  -- Non-secret provider configuration (region, site, scopes, etc.)
  config jsonb not null default '{}'::jsonb,
  -- Datadog secrets are stored in Vault; these columns reference the Vault secret IDs
  datadog_api_key_secret_id uuid references vault.secrets(id) on delete set null,
  datadog_app_key_secret_id uuid references vault.secrets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Require secrets when type=datadog
  constraint datadog_secrets_required
    check (
      type <> 'datadog' or (
        datadog_api_key_secret_id is not null and
        datadog_app_key_secret_id is not null
      )
    )
);

comment on table public.integrations is 'Third-party integrations linked to repositories. Secrets are stored in Supabase Vault.';
comment on column public.integrations.repository_id is 'References public.repositories(id). One repository can have many integrations.';
comment on column public.integrations.type is 'Provider type, e.g., github, datadog, etc.';
comment on column public.integrations.config is 'Provider-specific non-secret configuration.';
comment on column public.integrations.datadog_api_key_secret_id is 'Vault secret ID for Datadog API key (do not store plaintext).';
comment on column public.integrations.datadog_app_key_secret_id is 'Vault secret ID for Datadog APP key (do not store plaintext).';

-- Helpful indexes
create index if not exists idx_integrations_repo on public.integrations(repository_id);
create index if not exists idx_integrations_type on public.integrations(type);
create index if not exists idx_integrations_active on public.integrations(status) where status = 'active';

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_integrations_set_updated_at on public.integrations;
create trigger trg_integrations_set_updated_at
before update on public.integrations
for each row
execute procedure public.set_updated_at();

-- RLS: restrict table to service_role by default; other roles cannot access
alter table public.integrations enable row level security;

-- Deny by default: no permissive policy for anon/authenticated
drop policy if exists "allow service role all" on public.integrations;
create policy "allow service role all" on public.integrations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Tighten privileges
revoke all on public.integrations from public, anon, authenticated;
grant all on public.integrations to service_role;


