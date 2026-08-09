import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_CATEGORIES, JOB_EMPLOYMENT_TYPES } from '../constants.js';
import {
  JOB_SOURCE_PROVIDERS,
  JOB_SOURCE_TYPES,
  listEnabledGithubSources,
  validateJobSourceDraft,
} from '../ingestion/github/sourceRegistry.js';

test('phase 5 category and employment enums include planned live-source values', () => {
  for (const category of [
    'software_engineering',
    'data_science',
    'data_analytics',
    'machine_learning',
    'cybersecurity',
    'information_technology',
    'product_management',
    'quantitative_finance',
    'finance',
    'accounting',
    'consulting',
    'business',
    'operations',
    'design',
    'hardware',
    'other',
  ]) {
    assert.ok(CAREER_CATEGORIES.includes(category), `${category} should be allowed`);
  }

  for (const type of ['internship', 'co_op', 'new_grad', 'full_time', 'part_time', 'contract', 'apprenticeship', 'other']) {
    assert.ok(JOB_EMPLOYMENT_TYPES.includes(type), `${type} should be allowed`);
  }
});

test('source registry validates provider, category, and employment type', () => {
  assert.deepEqual(validateJobSourceDraft({
    provider: 'simplify',
    sourceName: 'Simplify New Grad Positions',
    repositoryOwner: 'SimplifyJobs',
    repositoryName: 'New-Grad-Positions',
    sourceType: 'github_repo',
    careerCategory: 'product_management',
    employmentType: 'new_grad',
  }), { valid: true, errors: {} });

  const invalid = validateJobSourceDraft({
    provider: 'unknown',
    sourceName: 'Bad Source',
    repositoryOwner: 'example',
    repositoryName: 'repo',
    sourceType: 'rss',
    careerCategory: 'product',
    employmentType: 'seasonal',
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.provider, 'Provider is invalid.');
  assert.equal(invalid.errors.sourceType, 'Source type is invalid.');
  assert.equal(invalid.errors.careerCategory, 'Career category is invalid.');
  assert.equal(invalid.errors.employmentType, 'Employment type is invalid.');
});

test('source registry exposes expected provider and source type allowlists', () => {
  assert.deepEqual(JOB_SOURCE_PROVIDERS, ['jobright', 'simplify']);
  assert.deepEqual(JOB_SOURCE_TYPES, ['github_repo']);
});

test('enabled GitHub source lookup excludes disabled sources and maps rows', async () => {
  const rows = [
    sourceRow({ id: 'enabled-2', enabled: true, priority: 20, source_name: 'B Source' }),
    sourceRow({ id: 'disabled', enabled: false, priority: 5, source_name: 'Disabled Source' }),
    sourceRow({ id: 'enabled-1', enabled: true, priority: 10, source_name: 'A Source' }),
  ];

  const service = {
    from(table) {
      assert.equal(table, 'job_board_sources');
      const state = { enabledOnly: false, sourceType: null };
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          if (column === 'enabled') state.enabledOnly = value === true;
          if (column === 'source_type') state.sourceType = value;
          return query;
        },
        order() {
          return query;
        },
        then(resolve) {
          const data = rows
            .filter((row) => !state.enabledOnly || row.enabled)
            .filter((row) => !state.sourceType || row.source_type === state.sourceType)
            .sort((a, b) => a.priority - b.priority || a.source_name.localeCompare(b.source_name));
          return Promise.resolve(resolve({ data, error: null }));
        },
      };
      return query;
    },
  };

  const sources = await listEnabledGithubSources(service);
  assert.deepEqual(sources.map((source) => source.id), ['enabled-1', 'enabled-2']);
  assert.equal(sources[0].sourceName, 'A Source');
  assert.equal(sources[0].repositoryOwner, 'SimplifyJobs');
  assert.equal(sources[0].careerCategory, 'software_engineering');
});

function sourceRow(overrides = {}) {
  return {
    id: 'source-id',
    provider: 'simplify',
    source_name: 'Simplify Summer 2026 Internships',
    repository_owner: 'SimplifyJobs',
    repository_name: 'Summer2026-Internships',
    branch: 'dev',
    source_url: 'https://github.com/SimplifyJobs/Summer2026-Internships',
    source_type: 'github_repo',
    career_category: 'software_engineering',
    employment_type: 'internship',
    enabled: true,
    priority: 10,
    parser_version: 'simplify-readme-v1',
    consecutive_failures: 0,
    metadata: {},
    created_at: '2026-08-09T00:00:00.000Z',
    updated_at: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}
