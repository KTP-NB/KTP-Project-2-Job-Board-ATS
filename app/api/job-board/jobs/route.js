import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { DEFAULT_JOBS_PER_PAGE, JOBS_PER_PAGE_OPTIONS } from '@/lib/job-board/constants';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';
import { inferDisplayEmploymentType, normalizeDisplayCareerCategory, toJobSummary } from '@/lib/job-board/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const params = url.searchParams;
  const page = Math.max(1, Number(params.get('page') || 1));
  const requestedPerPage = Number(params.get('perPage') || DEFAULT_JOBS_PER_PAGE);
  const perPage = JOBS_PER_PAGE_OPTIONS.includes(requestedPerPage)
    ? requestedPerPage
    : DEFAULT_JOBS_PER_PAGE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const service = getJobBoardServiceClient();
  const savedOnly = params.get('saved') === 'true';
  const savedJobIds = await getSavedJobIds(service, auth.user.id);

  if (savedOnly && savedJobIds.length === 0) {
    return NextResponse.json({
      jobs: [],
      pagination: { page, perPage, total: 0, totalPages: 0 },
      filters: await getFilterOptions(service),
    });
  }

  let query = service
    .from('job_board_jobs')
    .select('*', { count: 'exact' })
    .eq('status', 'open')
    .order('posted_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  const search = params.get('search')?.trim();
  if (search) {
    const safeSearch = search.replaceAll('%', '\\%').replaceAll(',', ' ');
    query = query.or(`title.ilike.%${safeSearch}%,company.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  const category = params.get('category');
  if (category) query = query.in('career_category', categoryDbValues(category));

  const employmentType = params.get('employmentType');
  if (employmentType) query = query.in('employment_type', employmentTypeDbValues(employmentType));

  const workplaceType = params.get('workplaceType');
  if (workplaceType) query = query.eq('workplace_type', workplaceType);

  const company = params.get('company');
  if (company) query = query.eq('company', company);

  if (params.get('postedToday') === 'true') {
    query = query.gte('posted_at', startOfTodayIso());
  }

  if (savedOnly) {
    query = query.in('id', savedJobIds);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const applicationsByJobId = await getApplicationsByJobId(
    service,
    auth.user.id,
    (data || []).map((job) => job.id)
  );

  return NextResponse.json({
    jobs: (data || []).map((job) => toJobSummary({
      ...job,
      saved: savedJobIds.includes(job.id),
      application: applicationsByJobId.get(job.id) || null,
    })),
    pagination: {
      page,
      perPage,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / perPage),
    },
    filters: await getFilterOptions(service),
  });
}

async function getSavedJobIds(service, userId) {
  const { data, error } = await service
    .from('job_board_saved_jobs')
    .select('job_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((row) => row.job_id);
}

async function getApplicationsByJobId(service, userId, jobIds) {
  if (!jobIds.length) return new Map();
  const { data, error } = await service
    .from('job_board_applications')
    .select('id, job_id, status, notes, applied_at, next_follow_up_at, updated_at')
    .eq('user_id', userId)
    .in('job_id', jobIds);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.job_id, row]));
}

async function getFilterOptions(service) {
  const { data } = await service
    .from('job_board_jobs')
    .select('company, career_category, employment_type, workplace_type, title, source_url, source_payload')
    .eq('status', 'open');

  return {
    companies: uniqueSorted(data?.map((job) => job.company)),
    categories: uniqueSorted(data?.map((job) => normalizeDisplayCareerCategory(job.career_category))),
    employmentTypes: uniqueSorted(data?.map((job) => inferDisplayEmploymentType(job))),
    workplaceTypes: uniqueSorted(data?.map((job) => job.workplace_type)),
  };
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function categoryDbValues(category) {
  const values = {
    product_management: ['product_management', 'product'],
    business_analytics: ['business_analytics', 'business'],
    machine_learning_ai: ['machine_learning_ai', 'machine_learning'],
  };
  return values[category] || [category];
}

function employmentTypeDbValues(employmentType) {
  if (employmentType === 'internship') return ['internship', 'new_grad'];
  return [employmentType];
}
