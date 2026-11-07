-- SquadGoals: Supabase schema
-- Run once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again (it only creates what is missing and refreshes the policies).

-- ---------------------------------------------------------------------------
-- 1. profiles: one public leaderboard row per user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  total_exp    integer not null default 0 check (total_exp >= 0),
  today_exp    integer not null default 0 check (today_exp >= 0),
  exp_date     date,                                  -- the user's local calendar day for today_exp
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. user_progress: private habits, history and EXP claim state
-- ---------------------------------------------------------------------------
create table if not exists public.user_progress (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  habits       jsonb not null default '[]'::jsonb,
  history      jsonb not null default '{}'::jsonb,
  gamification jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    profiles:      every signed-in user can read (shared leaderboard);
--                   users can only insert/update their own row.
--    user_progress: users can only read/insert/update their own row.
--    Signed-out (anon) visitors get nothing from either table.
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "Signed-in users can read the leaderboard" on public.profiles;
create policy "Signed-in users can read the leaderboard"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
  on public.user_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own progress" on public.user_progress;
create policy "Users can create their own progress"
  on public.user_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
  on public.user_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policies: rows are removed automatically when the auth user is deleted.

-- ---------------------------------------------------------------------------
-- 4. Keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.squadgoals_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.squadgoals_touch_updated_at();

drop trigger if exists user_progress_touch_updated_at on public.user_progress;
create trigger user_progress_touch_updated_at
  before update on public.user_progress
  for each row execute function public.squadgoals_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Create the leaderboard profile automatically at sign-up
--    (works even when email confirmation is on and the user has no session yet)
-- ---------------------------------------------------------------------------
create or replace function public.squadgoals_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if requested_name = '' then
    requested_name := split_part(coalesce(new.email, 'Friend'), '@', 1);
  end if;
  if requested_name = '' then
    requested_name := 'Friend';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_name, 40))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.squadgoals_handle_new_user() from public, anon, authenticated;

drop trigger if exists squadgoals_on_auth_user_created on auth.users;
create trigger squadgoals_on_auth_user_created
  after insert on auth.users
  for each row execute function public.squadgoals_handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. Realtime: broadcast leaderboard changes (still filtered by the RLS above)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
