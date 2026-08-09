import { CAREER_CATEGORIES, JOB_EMPLOYMENT_TYPES } from '../../constants.js';

export const JOB_SOURCE_PROVIDERS = ['jobright', 'simplify'];
export const JOB_SOURCE_TYPES = ['github_repo'];

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
