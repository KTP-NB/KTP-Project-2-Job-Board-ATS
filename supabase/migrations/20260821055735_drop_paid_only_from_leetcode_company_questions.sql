-- The site does not distinguish free from premium questions.
-- The bulk CSV dataset (github_import.py) cannot supply a paid/free signal, so
-- keeping this column would have meant ~35k imported rows reading `false` as a
-- default rather than an observation -- a wrong answer dressed up as a real one.
alter table public.leetcode_company_questions
  drop column paid_only;;
