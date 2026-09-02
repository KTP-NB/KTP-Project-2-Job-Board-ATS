alter table public.leetcode_company_questions
  add column if not exists sync_run uuid;

comment on column public.leetcode_company_questions.sync_run is
  'Token stamped by the scraper on every row it wrote in a given run. Rows for a company/timeframe whose sync_run differs from the latest run are pruned as stale.';
comment on column public.leetcode_company_questions.ac_rate is
  'LeetCode acceptance rate as a fraction between 0 and 1.';
comment on column public.leetcode_company_questions.difficulty is
  'Raw LeetCode difficulty, uppercase: EASY / MEDIUM / HARD.';

create index if not exists leetcode_company_questions_sync_run_idx
  on public.leetcode_company_questions (company, timeframe, sync_run);;
