create extension if not exists pgcrypto;

-- ─── EXISTING TABLES (unchanged) ──────────────────────────────────────────────

create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

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

create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null references public.profiles(clerk_id) on delete cascade,
  intentions text[] default '{}',
  match_types text[] default '{}',
  updated_at timestamptz default now()
);

-- ─── NEW COLUMNS ON PREFERENCES ───────────────────────────────────────────────

alter table public.preferences
  add column if not exists is_bipoc boolean,
  add column if not exists presentation text,
  add column if not exists presentation_preferences text[] default '{}',
  add column if not exists archetype text,
  add column if not exists archetype_preferences text[] default '{}';

-- ─── NEW TABLES ────────────────────────────────────────────────────────────────

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  from_clerk_id text not null references public.profiles(clerk_id) on delete cascade,
  to_clerk_id text not null references public.profiles(clerk_id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz default now(),
  unique(from_clerk_id, to_clerk_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_clerk_id text not null references public.profiles(clerk_id) on delete cascade,
  user_b_clerk_id text not null references public.profiles(clerk_id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_a_clerk_id, user_b_clerk_id)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index if not exists idx_profiles_clerk_id on public.profiles(clerk_id);
create index if not exists idx_preferences_clerk_id on public.preferences(clerk_id);
create index if not exists idx_profiles_onboarding_complete on public.profiles(onboarding_complete);
create index if not exists idx_interactions_from on public.interactions(from_clerk_id);
create index if not exists idx_interactions_to on public.interactions(to_clerk_id);
create index if not exists idx_matches_user_a on public.matches(user_a_clerk_id);
create index if not exists idx_matches_user_b on public.matches(user_b_clerk_id);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────

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

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'interactions'
  ) then
    alter publication supabase_realtime add table public.interactions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
