create table if not exists public.user_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null check (char_length(btrim(keyword)) between 1 and 50),
  normalized_keyword text not null check (char_length(btrim(normalized_keyword)) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (user_id, normalized_keyword)
);

alter table public.user_keywords enable row level security;

revoke all on table public.user_keywords from anon;
grant select, insert, delete on table public.user_keywords to authenticated;

drop policy if exists "Users can read own keywords" on public.user_keywords;
create policy "Users can read own keywords"
on public.user_keywords
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own keywords" on public.user_keywords;
create policy "Users can add own keywords"
on public.user_keywords
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own keywords" on public.user_keywords;
create policy "Users can delete own keywords"
on public.user_keywords
for delete
to authenticated
using ((select auth.uid()) = user_id);

