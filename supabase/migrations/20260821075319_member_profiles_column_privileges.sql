-- Column-level UPDATE only works once the table-wide grant is removed, so
-- swap the blanket UPDATE for the columns a member actually edits on /profile.
revoke update on public.member_profiles from authenticated, anon;

grant update (
  name,
  graduation_year,
  major,
  minors,
  linkedin_url,
  photo_url,
  photo_storage_path,
  resume_url,
  resume_storage_path,
  resume_bucket,
  updated_at
) on public.member_profiles to authenticated;;
