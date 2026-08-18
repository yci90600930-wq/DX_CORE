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

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null check (char_length(btrim(company_name)) between 1 and 100),
  entity_type text not null check (entity_type in ('sole_proprietor', 'corporation')),
  company_size text not null check (company_size in ('micro_business', 'small_enterprise', 'sme', 'mid_sized')),
  head_office_region text not null check (head_office_region in ('서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주')),
  factory_region text check (factory_region is null or factory_region in ('서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주')),
  industry text not null check (char_length(btrim(industry)) between 1 and 100),
  industry_detail text check (industry_detail is null or char_length(btrim(industry_detail)) between 1 and 150),
  founded_on date not null check (founded_on <= current_date),
  annual_revenue_krw bigint check (annual_revenue_krw is null or annual_revenue_krw >= 0),
  employee_count integer check (employee_count is null or employee_count >= 0),
  is_manufacturer boolean,
  has_factory_registration boolean,
  has_export_experience boolean,
  export_amount_krw bigint check (export_amount_krw is null or export_amount_krw >= 0),
  has_corporate_research_institute boolean,
  is_venture_certified boolean,
  is_innobiz_certified boolean,
  is_mainbiz_certified boolean,
  is_women_owned_certified boolean,
  is_disabled_owned_certified boolean,
  is_social_enterprise boolean,
  has_government_project_experience boolean,
  has_same_program_benefit boolean,
  has_participation_restriction boolean,
  desired_support_types text[] not null default '{}',
  profile_step smallint not null default 1 check (profile_step in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (has_export_experience is not false or export_amount_krw is null),
  check (desired_support_types <@ array['policy_fund','rnd','smart_factory','ai_dx','automation','export','sales_channel','workforce','facility_equipment','certification','consulting','esg_carbon_neutrality','startup']::text[])
);

create index if not exists company_profiles_owner_updated_idx
on public.company_profiles (owner_user_id, updated_at desc);

create or replace function public.set_company_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists company_profiles_set_updated_at on public.company_profiles;
create trigger company_profiles_set_updated_at
before update on public.company_profiles
for each row execute function public.set_company_profile_updated_at();

alter table public.company_profiles enable row level security;
revoke all on table public.company_profiles from anon;
grant select, insert, update, delete on table public.company_profiles to authenticated;

drop policy if exists "Users can read own company profiles" on public.company_profiles;
create policy "Users can read own company profiles"
on public.company_profiles for select to authenticated
using ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can add own company profiles" on public.company_profiles;
create policy "Users can add own company profiles"
on public.company_profiles for insert to authenticated
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can update own company profiles" on public.company_profiles;
create policy "Users can update own company profiles"
on public.company_profiles for update to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can delete own company profiles" on public.company_profiles;
create policy "Users can delete own company profiles"
on public.company_profiles for delete to authenticated
using ((select auth.uid()) = owner_user_id);
