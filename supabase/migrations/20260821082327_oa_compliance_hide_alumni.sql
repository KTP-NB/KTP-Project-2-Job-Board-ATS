-- Alumni are not part of the monthly OA roster at all.
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
  where coalesce(mp.member_status, '') <> 'Alumni'
  order by mp.name;
$$;

revoke all on function public.oa_compliance(timestamptz) from public, anon, authenticated;;
