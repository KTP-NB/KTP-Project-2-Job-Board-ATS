begin;

alter table public.member_profiles
  add column if not exists public_directory_visible boolean not null default true;

alter table public.member_invites
  add column if not exists public_directory_visible boolean not null default true;

comment on column public.member_profiles.public_directory_visible is
  'Whether this profile appears in the anonymous public member directory. Does not affect authenticated member access.';

comment on column public.member_invites.public_directory_visible is
  'Directory visibility inherited by members who register through this cohort invite.';

drop view if exists public.public_member_directory;
create view public.public_member_directory
with (security_barrier = true)
as
select
  id,
  name,
  position,
  image_path,
  photo_url,
  graduation_year,
  major,
  minors,
  linkedin_url,
  pledge_class,
  member_status,
  executive_board,
  committees,
  sort_order
from public.member_profiles
where public_directory_visible = true;

comment on view public.public_member_directory is
  'Public-safe member directory containing only profiles explicitly marked visible.';

-- Anonymous visitors must use the curated view so hidden profiles cannot be
-- recovered by calling PostgREST directly. Authenticated application flows
-- retain their existing member_profiles access and RLS protections.
revoke select on public.member_profiles from anon;
revoke all on public.public_member_directory from public;
grant select on public.public_member_directory to anon, authenticated;

commit;
