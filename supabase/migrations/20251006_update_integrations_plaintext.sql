-- Migration: Switch integrations secrets to plaintext columns
-- Created: 2025-10-06

-- Drop old constraint that enforced Vault secret IDs for Datadog
alter table public.integrations
  drop constraint if exists datadog_secrets_required;

-- Drop Vault-based secret ID columns if present
alter table public.integrations
  drop column if exists datadog_api_key_secret_id,
  drop column if exists datadog_app_key_secret_id;

-- Add plaintext secret columns (nullable unless type='datadog')
alter table public.integrations
  add column if not exists datadog_api_key text,
  add column if not exists datadog_app_key text;

comment on column public.integrations.datadog_api_key is 'Datadog API key (stored as plaintext). Consider using Vault in production.';
comment on column public.integrations.datadog_app_key is 'Datadog APP key (stored as plaintext). Consider using Vault in production.';

-- Enforce that Datadog integrations must provide both keys
alter table public.integrations
  add constraint datadog_keys_required
  check (
    type <> 'datadog' or (
      datadog_api_key is not null and
      datadog_app_key is not null
    )
  );


