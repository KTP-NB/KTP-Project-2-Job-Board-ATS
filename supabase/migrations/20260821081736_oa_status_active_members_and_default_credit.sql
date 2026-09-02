create or replace function public.company_questions_oa_status(profile_id uuid, as_of timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  -- First month the requirement is judged on real CodeRank submissions.
  -- Before this, everyone counts as completed unless a Super Admin says
  -- otherwise, so the manual override already has teeth.
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
  auto_credited boolean := false;
  completed boolean;
begin
  select mp.id, mp.user_id, mp.major, mp.access_role, mp.member_status into profile
  from public.member_profiles mp where mp.id = profile_id;

  if not found then
    return jsonb_build_object('required', false, 'completed', false, 'exempt_reason', 'no_profile');
  end if;

  month_start := date_trunc('month', as_of at time zone chapter_tz)::date;

  -- Only active members are held to the monthly assessment.
  if coalesce(profile.member_status, '') <> 'Active' then
    exempt_reason := 'not_active';
  elsif profile.access_role = 'super_admin' then
    exempt_reason := 'super_admin';
  elsif coalesce(profile.major, '') !~* '(computer science|data science)' then
    exempt_reason := 'major';
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

  auto_credited := window_start < oa_start_month and submitted is null and override_completed is null;
  completed := coalesce(override_completed, submitted is not null or window_start < oa_start_month);

  return jsonb_build_object(
    'required', exempt_reason is null,
    'exempt_reason', exempt_reason,
    'window_start', window_start,
    'window_end', window_end,
    'submitted_at', submitted,
    'override', override_completed,
    'auto_credited', auto_credited,
    'completed', completed
  );
end;
$$;

revoke all on function public.company_questions_oa_status(uuid, timestamptz) from public, anon, authenticated;;
