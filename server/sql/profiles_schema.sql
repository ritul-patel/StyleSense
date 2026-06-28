-- profiles_schema.sql
-- Run this in Supabase SQL Editor

-- Create profiles table
create table if not exists public.profiles (
id uuid references auth.users(id) on delete cascade primary key,
full_name text default '',
avatar_url text default '',
analysis_reminders boolean default true,
email_notifs boolean default true,
marketing_notifs boolean default false,
is_deleted boolean default false,
deleted_at timestamptz
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Reactivate account
create or replace function public.reactivate_account()
returns void
language plpgsql
security definer
as $$
declare
current_user_id uuid;
begin
current_user_id := auth.uid();

if current_user_id is null then
raise exception 'Not authenticated';
end if;

update public.profiles
set
is_deleted = false,
deleted_at = null,
analysis_reminders = true,
email_notifs = true,
marketing_notifs = false,
full_name = '',
avatar_url = ''
where id = current_user_id;

-- IMPORTANT:
-- Do NOT delete analyses
-- Do NOT delete saved outfits
-- Do NOT delete history

end;
$$;
