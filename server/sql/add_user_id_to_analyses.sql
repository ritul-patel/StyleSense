alter table public.analyses add column if not exists user_id uuid;
create index if not exists idx_analyses_user_id on public.analyses (user_id);
