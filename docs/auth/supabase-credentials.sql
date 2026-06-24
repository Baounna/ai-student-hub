-- AI and Cybersecurity News credentials auth table for Supabase/Postgres.
-- Run this in Supabase SQL editor before enabling:
-- AUTH_FLOW_MODE=credentials
-- AUTH_CREDENTIALS_BACKEND=supabase

create extension if not exists pgcrypto;

create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists auth_users_email_idx on public.auth_users (email);

-- Keep updated_at in sync.
create or replace function public.touch_auth_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists auth_users_touch_updated_at on public.auth_users;
create trigger auth_users_touch_updated_at
before update on public.auth_users
for each row
execute function public.touch_auth_users_updated_at();

-- Important:
-- If you enable RLS, keep service-role usage on server only.
-- This app uses SUPABASE_SERVICE_ROLE_KEY in server route handlers.
