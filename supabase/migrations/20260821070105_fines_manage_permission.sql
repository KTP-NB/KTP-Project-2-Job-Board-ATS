alter table public.member_profiles
  drop constraint if exists member_profiles_manager_permissions_check;

alter table public.member_profiles
  add constraint member_profiles_manager_permissions_check
  check (manager_permissions <@ array[
    'members.manage',
    'resumes.manage',
    'coderank.manage',
    'applications.manage',
    'fines.manage'
  ]::text[]);;
