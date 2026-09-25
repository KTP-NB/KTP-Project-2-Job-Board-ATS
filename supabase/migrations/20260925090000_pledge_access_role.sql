begin;

alter table public.member_profiles
  drop constraint if exists member_profiles_access_role_check;

alter table public.member_profiles
  add constraint member_profiles_access_role_check
  check (access_role in ('pledge', 'member', 'manager', 'admin', 'super_admin'));

alter table public.member_invites
  add column if not exists access_role text not null default 'member';

alter table public.member_invites
  drop constraint if exists member_invites_access_role_check;

alter table public.member_invites
  add constraint member_invites_access_role_check
  check (access_role in ('pledge', 'member'));

comment on column public.member_invites.access_role is
  'Access role assigned to accounts created through this invitation.';

-- Preserve the already-distributed Epsilon link while making it a Pledge
-- invite. Also normalize anyone who registered from that class before this
-- migration reached production.
update public.member_invites
set access_role = 'pledge', public_directory_visible = false
where active = true and lower(coalesce(pledge_class, '')) = 'epsilon';

update public.member_profiles
set access_role = 'pledge', public_directory_visible = false, updated_at = now()
where lower(coalesce(pledge_class, '')) = 'epsilon'
  and member_status = 'Active'
  and access_role = 'member';

-- LC Company Tagged is read directly through Supabase, so enforce the Pledge
-- restriction in the database-backed access function as well as in the UI.
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
  select mp.id, mp.access_role, mp.company_questions_blocked into profile
  from public.member_profiles mp where mp.user_id = uid;

  if not found then
    return jsonb_build_object(
      'allowed', false, 'reason', 'no_profile', 'blocked_by_admin', false,
      'outstanding_fines', 0, 'unpaid_fine_count', 0,
      'oa_required', false, 'oa_completed', false
    );
  end if;

  if profile.access_role = 'pledge' then
    return jsonb_build_object(
      'allowed', false, 'reason', 'role_restricted', 'blocked_by_admin', false,
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

commit;
