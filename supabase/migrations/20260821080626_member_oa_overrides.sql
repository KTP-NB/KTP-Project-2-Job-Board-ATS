create table if not exists public.member_oa_overrides (
  member_id uuid not null references public.member_profiles(id) on delete cascade,
  month_start date not null,
  completed boolean not null,
  note text,
  set_by uuid references auth.users(id) on delete set null,
  set_at timestamptz not null default now(),
  primary key (member_id, month_start)
);

comment on table public.member_oa_overrides is
  'Manual monthly OA credit set by a Super Admin. Read through security-definer functions and the admin API only.';

alter table public.member_oa_overrides enable row level security;
revoke all on public.member_oa_overrides from anon, authenticated;

create or replace function public.company_questions_oa_status(profile_id uuid, as_of timestamptz)
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
  exempt_reason text := null;
  submitted timestamptz := null;
  override_completed boolean := null;
begin
  select mp.id, mp.user_id, mp.major, mp.access_role into profile
  from public.member_profiles mp where mp.id = profile_id;

  if not found then
    return jsonb_build_object('required', false, 'completed', false, 'exempt_reason', 'no_profile');
  end if;

  month_start := date_trunc('month', as_of at time zone chapter_tz)::date;

  if profile.access_role = 'super_admin' then
    exempt_reason := 'super_admin';
  elsif coalesce(profile.major, '') !~* '(computer science|data science)' then
    exempt_reason := 'major';
  elsif month_start < oa_start_month then
    exempt_reason := 'not_started';
  end if;

  if oa_window = 'previous-month' then
    window_start := (month_start - interval '1 month')::date;
  else
    window_start := month_start;
  end if;
  window_end := (window_start + interval '1 month')::date;

  if profile.user_id is not null then
    select max(a.submitted_at) into submitted
    from public.cr_attempts a
    where a.user_id = profile.user_id
      and a.status = 'submitted'
      and a.submitted_at >= (window_start::timestamp at time zone chapter_tz)
      and a.submitted_at < (window_end::timestamp at time zone chapter_tz);
  end if;

  select o.completed into override_completed
  from public.member_oa_overrides o
  where o.member_id = profile.id and o.month_start = window_start;

  return jsonb_build_object(
    'required', exempt_reason is null,
    'exempt_reason', exempt_reason,
    'window_start', window_start,
    'window_end', window_end,
    'submitted_at', submitted,
    'override', override_completed,
    'completed', coalesce(override_completed, submitted is not null)
  );
end;
$$;

revoke all on function public.company_questions_oa_status(uuid, timestamptz) from public, anon, authenticated;

create or replace function public.company_questions_access_at(uid uuid, as_of timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  profile record;
  outstanding numeric := 0;
  unpaid_count int := 0;
  oa jsonb;
begin
  select mp.id, mp.company_questions_blocked into profile
  from public.member_profiles mp where mp.user_id = uid;

  if not found then
    return jsonb_build_object(
      'allowed', false, 'reason', 'no_profile', 'blocked_by_admin', false,
      'outstanding_fines', 0, 'unpaid_fine_count', 0,
      'oa_required', false, 'oa_completed', false
    );
  end if;

  select coalesce(sum(f.amount), 0), count(*) into outstanding, unpaid_count
  from public.member_fines f
  where f.member_id = profile.id and f.paid = false;

  oa := public.company_questions_oa_status(profile.id, as_of);

  return jsonb_build_object(
    'allowed', not profile.company_questions_blocked
               and outstanding <= 0
               and (not (oa->>'required')::boolean or (oa->>'completed')::boolean),
    'member_id', profile.id,
    'blocked_by_admin', profile.company_questions_blocked,
    'outstanding_fines', outstanding,
    'unpaid_fine_count', unpaid_count,
    'oa_required', (oa->>'required')::boolean,
    'oa_exempt_reason', oa->>'exempt_reason',
    'oa_window_start', oa->>'window_start',
    'oa_window_end', oa->>'window_end',
    'oa_completed', (oa->>'completed')::boolean,
    'oa_completed_at', oa->>'submitted_at',
    'oa_override', oa->'override',
    'evaluated_at', as_of
  );
end;
$$;

revoke all on function public.company_questions_access_at(uuid, timestamptz) from public, anon, authenticated;

create or replace function public.oa_compliance(as_of timestamptz)
returns table (
  member_id uuid,
  member_name text,
  major text,
  chapter_position text,
  pledge_class text,
  member_status text,
  access_role text,
  has_account boolean,
  status jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select mp.id, mp.name, mp.major, mp.position, mp.pledge_class, mp.member_status,
         mp.access_role, mp.user_id is not null,
         public.company_questions_oa_status(mp.id, as_of)
  from public.member_profiles mp
  order by mp.name;
$$;

revoke all on function public.oa_compliance(timestamptz) from public, anon, authenticated;;
