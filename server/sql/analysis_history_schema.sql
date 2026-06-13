-- StyleSense analysis history schema support (Supabase/PostgreSQL)
-- Run this in your database before relying on /history and /:id retrieval for legacy rows.

create extension if not exists pgcrypto;

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  skin_tone text not null,
  undertone text not null,
  result jsonb not null default '{}'::jsonb,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.analyses
  add column if not exists skin_tone text,
  add column if not exists undertone text,
  add column if not exists user_id uuid,
  add column if not exists result jsonb default '{}'::jsonb,
  add column if not exists image_url text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_analyses_created_at on public.analyses (created_at desc);
create index if not exists idx_analyses_skin_tone on public.analyses (skin_tone);
create index if not exists idx_analyses_undertone on public.analyses (undertone);
create index if not exists idx_analyses_user_id on public.analyses (user_id);

-- Optional compatibility table used by older versions of the app.
create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  best_colors jsonb,
  avoid_colors jsonb,
  outfits jsonb,
  color_profile jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'results_analysis_id_key'
      and conrelid = 'public.results'::regclass
  ) then
    alter table public.results
      add constraint results_analysis_id_key unique (analysis_id);
  end if;
end $$;
