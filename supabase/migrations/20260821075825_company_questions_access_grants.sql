-- Functions default to EXECUTE for PUBLIC; keep them to signed-in members.
revoke all on function public.company_questions_access() from public, anon;
revoke all on function public.company_questions_allowed() from public, anon;
grant execute on function public.company_questions_access() to authenticated;
grant execute on function public.company_questions_allowed() to authenticated;;
