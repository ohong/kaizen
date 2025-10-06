-- Migration: Remove RLS restrictions from integrations table
-- Created: 2025-10-06

-- Drop existing RLS policy
drop policy if exists "allow service role all" on public.integrations;

-- Disable RLS on integrations table
alter table public.integrations disable row level security;

-- Grant broader access to integrations table
grant all on public.integrations to authenticated;
grant all on public.integrations to anon;
grant all on public.integrations to public;

-- Add helpful comment
comment on table public.integrations is 'Third-party integrations linked to repositories. RLS disabled for broader access.';
