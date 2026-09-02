create or replace view public.leetcode_companies
with (security_invoker = true) as
select
  company,
  sum(question_count)::int as question_count,
  jsonb_object_agg(timeframe, question_count) as timeframe_counts
from public.leetcode_company_question_facets
group by company;

grant select on public.leetcode_companies to authenticated;;
