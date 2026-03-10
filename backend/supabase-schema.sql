create extension if not exists pgcrypto;

-- Auth users table (email/password)
create table if not exists auth_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Profiles table
create table if not exists profiles (
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
create table if not exists preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null references profiles(clerk_id) on delete cascade,
  intentions text[] default '{}',
  match_types text[] default '{}',
  updated_at timestamptz default now()
);

-- Enable realtime on both tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table preferences;
