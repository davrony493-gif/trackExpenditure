-- Wrenhollow member accounts: run this once in Supabase → SQL Editor → New query → Run.
-- Row Level Security (RLS) makes sure each member can only ever see and change their own rows.
-- Staff manage everything from the Supabase dashboard (Table Editor), which bypasses RLS.

-- ---------- Profiles (one per account) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text check (char_length(full_name) <= 100),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Members read own profile" on public.profiles;
create policy "Members read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Members update own profile" on public.profiles;
create policy "Members update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Members may only change their name and marketing choice.
revoke update on public.profiles from authenticated;
grant update (full_name, marketing_opt_in) on public.profiles to authenticated;

-- Create the profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, marketing_opt_in)
  values (
    new.id,
    left(new.raw_user_meta_data ->> 'full_name', 100),
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Booking requests ----------
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  experience text not null check (char_length(experience) <= 100),
  visit_date date not null,
  guests int not null check (guests between 1 and 12),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;

drop policy if exists "Members read own bookings" on public.bookings;
create policy "Members read own bookings" on public.bookings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Members request bookings" on public.bookings;
create policy "Members request bookings" on public.bookings
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'requested' and visit_date >= current_date);

-- Members can cancel their own booking, and that is the only change they can make.
drop policy if exists "Members cancel own bookings" on public.bookings;
create policy "Members cancel own bookings" on public.bookings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status = 'cancelled');
revoke update on public.bookings from authenticated;
grant update (status) on public.bookings to authenticated;

-- ---------- Loyalty stamps (added by staff in the dashboard, read-only for members) ----------
create table if not exists public.stamps (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.stamps enable row level security;

drop policy if exists "Members read own stamps" on public.stamps;
create policy "Members read own stamps" on public.stamps
  for select to authenticated using ((select auth.uid()) = user_id);
