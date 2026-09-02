alter table public.member_profiles
  add column if not exists company_questions_blocked boolean not null default false;

comment on column public.member_profiles.company_questions_blocked is
  'Super Admin override that revokes LC Company Tagged access regardless of fines or OA status.';

revoke update (access_role, manager_permissions, company_questions_blocked)
  on public.member_profiles from authenticated, anon;

create or replace function public.company_questions_access_at(uid uuid, as_of timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  oa_start_month constant date := date '2026-09-01';
  oa_window constant text := 'current-month';
  chapter_tz constant text := 'America/New_York';

  profile record;
  month_start date;
  window_start date;
  window_end date;
  outstanding numeric := 0;
  unpaid_count int := 0;
  oa_required boolean := false;
  oa_exempt_reason text := null;
  oa_completed_at timestamptz := null;
begin
  select mp.id, mp.name, mp.major, mp.access_role, mp.member_status, mp.company_questions_blocked
    into profile
  from public.member_profiles mp
  where mp.user_id = uid;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'no_profile',
      'blocked_by_admin', false,
      'outstanding_fines', 0,
      'unpaid_fine_count', 0,
      'oa_required', false,
      'oa_completed', false
    );
  end if;

  month_start := date_trunc('month', as_of at time zone chapter_tz)::date;

  select coalesce(sum(f.amount), 0), count(*)
    into outstanding, unpaid_count
  from public.member_fines f
  where f.member_id = profile.id
    and f.paid = false;

  if profile.access_role = 'super_admin' then
    oa_exempt_reason := 'super_admin';
  elsif coalesce(profile.major, '') !~* '(computer science|data science)' then
    oa_exempt_reason := 'major';
  elsif month_start < oa_start_month then
    oa_exempt_reason := 'not_started';
  end if;

  if oa_exempt_reason is null then
    oa_required := true;
    if oa_window = 'previous-month' then
      window_start := (month_start - interval '1 month')::date;
      window_end := month_start;
    else
      window_start := month_start;
      window_end := (month_start + interval '1 month')::date;
    end if;

    select max(a.submitted_at) into oa_completed_at
    from public.cr_attempts a
    where a.user_id = uid
      and a.status = 'submitted'
      and a.submitted_at >= (window_start::timestamp at time zone chapter_tz)
      and a.submitted_at < (window_end::timestamp at time zone chapter_tz);
  end if;

  return jsonb_build_object(
    'allowed', not profile.company_questions_blocked
               and outstanding <= 0
               and (not oa_required or oa_completed_at is not null),
    'member_id', profile.id,
    'blocked_by_admin', profile.company_questions_blocked,
    'outstanding_fines', outstanding,
    'unpaid_fine_count', unpaid_count,
    'oa_required', oa_required,
    'oa_exempt_reason', oa_exempt_reason,
    'oa_window_start', window_start,
    'oa_window_end', window_end,
    'oa_completed', oa_completed_at is not null,
    'oa_completed_at', oa_completed_at,
    'evaluated_at', as_of
  );
end;
$$;

revoke all on function public.company_questions_access_at(uuid, timestamptz) from public, anon, authenticated;

create or replace function public.company_questions_access()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.company_questions_access_at((select auth.uid()), now());
$$;

create or replace function public.company_questions_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (public.company_questions_access_at((select auth.uid()), now())->>'allowed')::boolean,
    false
  );
$$;

grant execute on function public.company_questions_access() to authenticated;
grant execute on function public.company_questions_allowed() to authenticated;

drop policy if exists authenticated_read_leetcode_company_questions on public.leetcode_company_questions;
create policy authenticated_read_leetcode_company_questions
on public.leetcode_company_questions
for select
to authenticated
using (public.company_questions_allowed());;
