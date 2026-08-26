import { CAREER_CATEGORIES, JOB_EMPLOYMENT_TYPES } from '../../constants.js';

export const JOB_SOURCE_PROVIDERS = ['jobright', 'simplify'];
export const JOB_SOURCE_TYPES = ['github_repo'];
export const JOB_SOURCE_CLASSIFICATIONS = ['aggregate', 'specialized'];

export const JOBRIGHT_INTERNSHIP_SOURCE_DEFINITIONS = [
  jobrightInternshipSource('2026-Software-Engineer-Internship', 'software_engineering', 100),
  jobrightInternshipSource('2026-Data-Analysis-Internship', 'data_analytics', 110),
  jobrightInternshipSource('2026-Product-Management-Internship', 'product_management', 120),
  jobrightInternshipSource('2026-Engineer-Internship', 'engineering', 130),
  jobrightInternshipSource('2026-Consultant-Internship', 'consulting', 140),
  jobrightInternshipSource('2026-Business-Analyst-Internship', 'business_analytics', 150),
  jobrightInternshipSource('2026-Account-Internship', 'accounting', 160),
  jobrightInternshipSource('2026-Public-Sector-Internship', 'public_sector', 170),
  jobrightInternshipSource('2026-Marketing-Internship', 'marketing', 180),
  jobrightInternshipSource('2026-Sales-Internship', 'sales', 190),
  jobrightInternshipSource('2026-Design-Internship', 'design', 200),
  jobrightInternshipSource('2026-HR-Internship', 'human_resources', 210),
  jobrightInternshipSource('2026-Legal-Internship', 'legal_compliance', 220),
  jobrightInternshipSource('2026-Art-Internship', 'arts_entertainment', 230),
  jobrightInternshipSource('2026-Education-Internship', 'education', 240),
  jobrightInternshipSource('2026-Management-Internship', 'management', 250),
  jobrightInternshipSource('2026-Support-Internship', 'customer_support', 260),
  jobrightAggregateInternshipSource(),
];

export function validateJobSourceDraft(source) {
  const errors = {};

  if (!JOB_SOURCE_PROVIDERS.includes(source?.provider)) {
    errors.provider = 'Provider is invalid.';
  }
  if (!source?.sourceName && !source?.source_name) {
    errors.sourceName = 'Source name is required.';
  }
  if (!source?.repositoryOwner && !source?.repository_owner) {
    errors.repositoryOwner = 'Repository owner is required.';
  }
  if (!source?.repositoryName && !source?.repository_name) {
    errors.repositoryName = 'Repository name is required.';
  }
  if (!JOB_SOURCE_TYPES.includes(source?.sourceType || source?.source_type || 'github_repo')) {
    errors.sourceType = 'Source type is invalid.';
  }
  if (!JOB_SOURCE_CLASSIFICATIONS.includes(source?.sourceClassification || source?.source_classification || 'aggregate')) {
    errors.sourceClassification = 'Source classification is invalid.';
  }
  if (!CAREER_CATEGORIES.includes(source?.careerCategory || source?.career_category)) {
    errors.careerCategory = 'Career category is invalid.';
  }
  if (!JOB_EMPLOYMENT_TYPES.includes(source?.employmentType || source?.employment_type)) {
    errors.employmentType = 'Employment type is invalid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function listEnabledGithubSources(service) {
  const { data, error } = await service
    .from('job_board_sources')
    .select('*')
    .eq('enabled', true)
    .eq('source_type', 'github_repo')
    .order('priority', { ascending: true })
    .order('source_name', { ascending: true });

  if (error) throw error;
  return (data || []).map(toJobSourceModel);
}

export async function getGithubSourceById(service, sourceId) {
  const { data, error } = await service
    .from('job_board_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('source_type', 'github_repo')
    .maybeSingle();

  if (error) throw error;
  return data ? toJobSourceModel(data) : null;
}

export function toJobSourceModel(row) {
  return {
    id: row.id,
    provider: row.provider,
    sourceName: row.source_name,
    repositoryOwner: row.repository_owner,
    repositoryName: row.repository_name,
    branch: row.branch,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    sourceClassification: row.source_classification || 'aggregate',
    careerCategory: row.career_category,
    employmentType: row.employment_type,
    enabled: Boolean(row.enabled),
    priority: row.priority,
    parserVersion: row.parser_version,
    lastAttemptAt: row.last_attempt_at,
    lastSuccessAt: row.last_success_at,
    consecutiveFailures: row.consecutive_failures,
    lastFetchedSha: row.last_fetched_sha,
    lastFetchedEtag: row.last_fetched_etag,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function jobrightInternshipSource(repositoryName, careerCategory, priority) {
  return {
    provider: 'jobright',
    sourceName: `Jobright ${repositoryName.replace(/^2026-/, '').replace(/-/g, ' ')}`,
    repositoryOwner: 'jobright-ai',
    repositoryName,
    branch: 'master',
    sourceUrl: `https://github.com/jobright-ai/${repositoryName}`,
    sourceType: 'github_repo',
    sourceClassification: 'specialized',
    careerCategory,
    employmentType: 'internship',
    enabled: true,
    priority,
    parserVersion: 'jobright-readme-v1',
  };
}

function jobrightAggregateInternshipSource() {
  return {
    provider: 'jobright',
    sourceName: 'Jobright 2026 Internship Aggregate',
    repositoryOwner: 'jobright-ai',
    repositoryName: '2026-Internship',
    branch: 'master',
    sourceUrl: 'https://github.com/jobright-ai/2026-Internship',
    sourceType: 'github_repo',
    sourceClassification: 'aggregate',
    careerCategory: 'other',
    employmentType: 'internship',
    enabled: false,
    priority: 900,
    parserVersion: 'jobright-readme-v1',
  };
}
