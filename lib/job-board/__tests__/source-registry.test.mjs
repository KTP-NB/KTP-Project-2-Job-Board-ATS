import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAREER_CATEGORIES, CAREER_CATEGORY_GROUPS, JOB_EMPLOYMENT_TYPES } from '../constants.js';
import {
  JOB_SOURCE_CLASSIFICATIONS,
  JOB_SOURCE_PROVIDERS,
  JOB_SOURCE_TYPES,
  JOBRIGHT_INTERNSHIP_SOURCE_DEFINITIONS,
  INTERN_LIST_US_INTERNSHIP_SOURCE_DEFINITIONS,
  listEnabledGithubSources,
  validateJobSourceDraft,
} from '../ingestion/github/sourceRegistry.js';

test('phase 5 category and employment enums include planned live-source values', () => {
  for (const category of [
    'software_engineering',
    'data_science',
    'data_analytics',
    'machine_learning_ai',
    'cybersecurity',
    'information_technology',
    'engineering',
    'product_management',
    'quantitative_finance',
    'finance',
    'accounting',
    'business_analytics',
    'consulting',
    'operations',
    'management',
    'marketing',
    'sales',
    'design',
    'arts_entertainment',
    'human_resources',
    'legal_compliance',
    'public_sector',
    'education',
    'healthcare',
    'supply_chain',
    'customer_support',
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
    sourceClassification: 'aggregate',
    careerCategory: 'product_management',
    employmentType: 'new_grad',
  }), { valid: true, errors: {} });

  const invalid = validateJobSourceDraft({
    provider: 'unknown',
    sourceName: 'Bad Source',
    repositoryOwner: 'example',
    repositoryName: 'repo',
    sourceType: 'rss',
    sourceClassification: 'unknown',
    careerCategory: 'product',
    employmentType: 'seasonal',
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.provider, 'Provider is invalid.');
  assert.equal(invalid.errors.sourceType, 'Source type is invalid.');
  assert.equal(invalid.errors.sourceClassification, 'Source classification is invalid.');
  assert.equal(invalid.errors.careerCategory, 'Career category is invalid.');
  assert.equal(invalid.errors.employmentType, 'Employment type is invalid.');
});

test('source registry exposes expected provider and source type allowlists', () => {
  assert.deepEqual(JOB_SOURCE_PROVIDERS, ['jobright', 'simplify', 'intern_list']);
  assert.deepEqual(JOB_SOURCE_TYPES, ['github_repo', 'airtable_shared_view']);
  assert.deepEqual(JOB_SOURCE_CLASSIFICATIONS, ['aggregate', 'specialized']);
});

test('source registry validates Intern List Airtable shared-view sources', () => {
  assert.deepEqual(validateJobSourceDraft({
    provider: 'intern_list',
    sourceName: 'Intern List US Software Engineering Internships',
    sourceType: 'airtable_shared_view',
    sourceClassification: 'specialized',
    careerCategory: 'software_engineering',
    employmentType: 'internship',
  }), { valid: true, errors: {} });
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
  assert.equal(sources[0].sourceClassification, 'aggregate');
});

test('career category filter groups cover every active taxonomy value once', () => {
  const grouped = CAREER_CATEGORY_GROUPS.flatMap((group) => group.categories);
  assert.deepEqual([...new Set(grouped)].sort(), [...CAREER_CATEGORIES].sort());
});

test('Jobright internship source definitions map discovered repos to categories', () => {
  const byRepo = new Map(JOBRIGHT_INTERNSHIP_SOURCE_DEFINITIONS.map((source) => [source.repositoryName, source]));

  for (const [repositoryName, category] of [
    ['2026-Software-Engineer-Internship', 'software_engineering'],
    ['2026-Data-Analysis-Internship', 'data_analytics'],
    ['2026-Engineer-Internship', 'engineering'],
    ['2026-Consultant-Internship', 'consulting'],
    ['2026-Business-Analyst-Internship', 'business_analytics'],
    ['2026-Account-Internship', 'accounting'],
    ['2026-Marketing-Internship', 'marketing'],
    ['2026-Design-Internship', 'design'],
    ['2026-HR-Internship', 'human_resources'],
    ['2026-Legal-Internship', 'legal_compliance'],
    ['2026-Management-Internship', 'management'],
    ['2026-Support-Internship', 'customer_support'],
  ]) {
    const source = byRepo.get(repositoryName);
    assert.equal(source?.provider, 'jobright');
    assert.equal(source?.branch, 'master');
    assert.equal(source?.sourceClassification, 'specialized');
    assert.equal(source?.careerCategory, category);
    assert.equal(source?.employmentType, 'internship');
    assert.equal(source?.enabled, true);
  }

  const aggregate = byRepo.get('2026-Internship');
  assert.equal(aggregate.sourceClassification, 'aggregate');
  assert.equal(aggregate.enabled, false);
  assert.equal(aggregate.careerCategory, 'other');
});

test('Intern List US internship source definitions include only approved categories', () => {
  assert.deepEqual(
    INTERN_LIST_US_INTERNSHIP_SOURCE_DEFINITIONS.map((source) => source.careerCategory),
    [
      'software_engineering',
      'data_analytics',
      'machine_learning_ai',
      'product_management',
      'accounting',
      'engineering',
      'business_analytics',
      'cybersecurity',
      'consulting',
      'management',
    ]
  );
  for (const source of INTERN_LIST_US_INTERNSHIP_SOURCE_DEFINITIONS) {
    assert.equal(source.provider, 'intern_list');
    assert.equal(source.sourceType, 'airtable_shared_view');
    assert.equal(source.employmentType, 'internship');
    assert.equal(source.enabled, true);
    assert.equal(source.metadata.country, 'US');
    assert.match(source.metadata.airtableEmbedUrl, /^https:\/\/airtable\.com\/embed\//);
  }
});

test('unknown category remains invalid unless mapped to other', () => {
  const invalid = validateJobSourceDraft({
    provider: 'jobright',
    sourceName: 'Unknown Source',
    repositoryOwner: 'jobright-ai',
    repositoryName: '2026-Unknown-Internship',
    sourceType: 'github_repo',
    sourceClassification: 'specialized',
    careerCategory: 'unknown_category',
    employmentType: 'internship',
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.careerCategory, 'Career category is invalid.');

  assert.equal(validateJobSourceDraft({
    provider: 'jobright',
    sourceName: 'Other Source',
    repositoryOwner: 'jobright-ai',
    repositoryName: '2026-Other-Internship',
    sourceType: 'github_repo',
    sourceClassification: 'specialized',
    careerCategory: 'other',
    employmentType: 'internship',
  }).valid, true);
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
    source_classification: 'aggregate',
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
