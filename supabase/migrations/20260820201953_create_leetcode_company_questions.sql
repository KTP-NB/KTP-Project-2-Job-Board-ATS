create table if not exists public.leetcode_company_questions (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  timeframe text not null,
  title_slug text not null,
  title text not null,
  question_frontend_id text,
  leetcode_id bigint,
  difficulty text,
  frequency numeric,
  ac_rate numeric,
  paid_only boolean not null default false,
  topic_tags jsonb not null default '[]'::jsonb,
  url text,
  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leetcode_company_questions_unique_slug unique (company, timeframe, title_slug)
);

comment on table public.leetcode_company_questions is
  'LeetCode company-tagged interview questions scraped per company/timeframe. Written by the scraper (service role); read by the KTP website.';
comment on column public.leetcode_company_questions.timeframe is
  'LeetCode frequency window slug, e.g. thirty-days, three-months, six-months, more-than-six-months, all.';
comment on column public.leetcode_company_questions.frequency is
  'LeetCode relative frequency score within this company/timeframe list (higher = asked more often).';
comment on column public.leetcode_company_questions.scraped_at is
  'last_updated timestamp from the scraper output file this row came from.';

create index if not exists leetcode_company_questions_company_timeframe_freq_idx
  on public.leetcode_company_questions (company, timeframe, frequency desc nulls last);
create index if not exists leetcode_company_questions_title_slug_idx
  on public.leetcode_company_questions (title_slug);
create index if not exists leetcode_company_questions_difficulty_idx
  on public.leetcode_company_questions (difficulty);
create index if not exists leetcode_company_questions_topic_tags_idx
  on public.leetcode_company_questions using gin (topic_tags);

drop trigger if exists set_leetcode_company_questions_updated_at on public.leetcode_company_questions;
create trigger set_leetcode_company_questions_updated_at
  before update on public.leetcode_company_questions
  for each row execute function public.set_updated_at();

alter table public.leetcode_company_questions enable row level security;

drop policy if exists authenticated_read_leetcode_company_questions on public.leetcode_company_questions;
create policy authenticated_read_leetcode_company_questions
  on public.leetcode_company_questions
  for select
  to authenticated
  using (true);;
