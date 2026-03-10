create extension if not exists pgcrypto;

-- Auth users table (email/password)
create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  name text,
  pronouns text,
  email text,
  avatar_url text,
  era integer default 50,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Preferences table
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null references public.profiles(clerk_id) on delete cascade,
  intentions text[] default '{}',
  match_types text[] default '{}',
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_clerk_id on public.profiles(clerk_id);
create index if not exists idx_preferences_clerk_id on public.preferences(clerk_id);
create index if not exists idx_profiles_onboarding_complete on public.profiles(onboarding_complete);

-- Enable realtime on both tables
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'preferences'
  ) then
    alter publication supabase_realtime add table public.preferences;
  end if;
end $$;
