import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubRecords, runGithubIngestion, withinLookback } from '../ingestion/github/runGithubIngestion.js';

test('github ingestion dispatches parser by provider', () => {
  const content = `
Company | Job Title | Location | Work Model | Date Posted
--- | --- | --- | --- | ---
**[Acme](https://jobs.example.com/acme)** | Data Analyst | Remote | Remote | Today
`;
  const records = parseGithubRecords(content, {
    id: 'source-1',
    provider: 'jobright',
    sourceName: 'Jobright Data',
    repositoryOwner: 'jobright-ai',
    repositoryName: '2026-Data-Analysis-New-Grad',
    careerCategory: 'data_analytics',
    employmentType: 'new_grad',
  }, { cycleStartedAt: '2026-08-09T12:00:00.000Z' });

  assert.equal(records.length, 1);
  assert.equal(records[0].provider, 'jobright');
  assert.equal(records[0].company, 'Acme');
});

test('github ingestion lookback accepts a 3-day recovery window only', () => {
  const cycleStartedAt = '2026-08-09T12:00:00.000Z';
  assert.equal(withinLookback('2026-08-09T04:00:00.000Z', cycleStartedAt), true);
  assert.equal(withinLookback('2026-08-06T12:00:00.000Z', cycleStartedAt), true);
  assert.equal(withinLookback('2026-08-05T12:00:00.000Z', cycleStartedAt), false);
});

test('github ingestion isolates one failing source and continues remaining sources', async () => {
  const service = createMemoryService({
    job_board_sources: [
      sourceRow({ id: 'source-a', source_name: 'A Source', repository_name: 'repo-a', priority: 1 }),
      sourceRow({ id: 'source-b', source_name: 'B Source', repository_name: 'broken-repo', priority: 2 }),
      sourceRow({ id: 'source-c', source_name: 'C Source', repository_name: 'repo-c', priority: 3 }),
    ],
  });

  const summary = await runGithubIngestion({
    service,
    cycleStartedAt: '2026-08-09T12:00:00.000Z',
    env: { NODE_ENV: 'test', GITHUB_INGEST_TOKEN: 'token' },
    fetcher: async (url) => {
      if (url.includes('broken-repo')) return githubResponse('', { ok: false, status: 404 });
      return githubResponse(jobrightContent(url.includes('repo-c') ? 'Beta Labs' : 'Acme Labs'));
    },
  });

  assert.equal(summary.sources, 3);
  assert.equal(summary.failed, 1);
  assert.equal(summary.inserted, 2);
  assert.equal(service.tables.job_board_ingestion_runs.filter((run) => run.status === 'completed').length, 2);
  assert.equal(service.tables.job_board_ingestion_runs.filter((run) => run.status === 'failed').length, 1);
  assert.equal(service.tables.job_board_jobs.length, 2);
  assert.equal(service.tables.job_board_sources.find((source) => source.id === 'source-b').consecutive_failures, 1);
});

test('github ingestion is idempotent across repeated cycles and leaves source configuration intact', async () => {
  const service = createMemoryService({
    job_board_sources: [
      sourceRow({ id: 'enabled-source', source_name: 'Enabled Source', priority: 1 }),
      sourceRow({ id: 'disabled-source', source_name: 'Disabled Source', enabled: false, priority: 2 }),
    ],
  });
  const fetcher = async () => githubResponse(jobrightContent('Acme Labs'));

  const first = await runGithubIngestion({
    service,
    cycleStartedAt: '2026-08-09T12:00:00.000Z',
    env: { NODE_ENV: 'test', GITHUB_INGEST_TOKEN: 'token' },
    fetcher,
  });
  const second = await runGithubIngestion({
    service,
    cycleStartedAt: '2026-08-09T14:00:00.000Z',
    env: { NODE_ENV: 'test', GITHUB_INGEST_TOKEN: 'token' },
    fetcher,
  });

  assert.equal(first.inserted, 1);
  assert.equal(second.inserted, 0);
  assert.equal(second.updated, 1);
  assert.equal(second.duplicate, 1);
  assert.equal(service.tables.job_board_jobs.length, 1);
  assert.equal(service.tables.job_board_source_links.length, 1);
  assert.equal(service.tables.job_board_source_links[0].first_seen_at, '2026-08-09T12:00:00.000Z');
  assert.equal(service.tables.job_board_source_links[0].last_seen_at, '2026-08-09T14:00:00.000Z');
  assert.equal(service.tables.job_board_sources.find((source) => source.id === 'disabled-source').last_attempt_at, null);
  assert.equal(service.tables.job_board_sources.find((source) => source.id === 'enabled-source').repository_name, 'repo-a');
});

function jobrightContent(company) {
  return `
Company | Job Title | Location | Work Model | Date Posted
--- | --- | --- | --- | ---
**[${company}](https://jobs.example.com/${company.toLowerCase().replace(/\s+/g, '-')}/analyst?utm_source=github)** | Data Analyst | Remote | Remote | Today
`;
}

function githubResponse(content, overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status || 200,
    headers: {
      get(name) {
        if (name.toLowerCase() === 'etag') return overrides.etag || '"sha"';
        return null;
      },
    },
    async text() {
      return content;
    },
  };
}

function sourceRow(overrides = {}) {
  return {
    id: 'source-a',
    provider: 'jobright',
    source_name: 'A Source',
    repository_owner: 'jobright-ai',
    repository_name: 'repo-a',
    branch: 'master',
    source_url: 'https://github.com/jobright-ai/repo-a',
    source_type: 'github_repo',
    source_classification: 'specialized',
    career_category: 'data_analytics',
    employment_type: 'new_grad',
    enabled: true,
    priority: 1,
    parser_version: 'jobright-readme-v1',
    last_attempt_at: null,
    last_success_at: null,
    consecutive_failures: 0,
    last_fetched_etag: null,
    metadata: {},
    created_at: '2026-08-09T00:00:00.000Z',
    updated_at: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}

function createMemoryService(initialTables = {}) {
  const tables = {
    job_board_sources: [],
    job_board_ingestion_runs: [],
    job_board_jobs: [],
    job_board_source_links: [],
    ...initialTables,
  };

  return {
    tables,
    from(table) {
      return createQuery(tables, table);
    },
  };
}

function createQuery(tables, table) {
  const state = {
    filters: [],
    orders: [],
    operation: 'select',
    payload: null,
    limitCount: null,
  };

  const query = {
    select() {
      return query;
    },
    eq(column, value) {
      state.filters.push({ column, value });
      return query;
    },
    order(column, options = {}) {
      state.orders.push({ column, ascending: options.ascending !== false });
      return query;
    },
    limit(count) {
      state.limitCount = count;
      return query;
    },
    insert(payload) {
      state.operation = 'insert';
      state.payload = payload;
      return query;
    },
    update(payload) {
      state.operation = 'update';
      state.payload = payload;
      return query;
    },
    maybeSingle() {
      return execute({ maybe: true, arrayResult: false });
    },
    single() {
      return execute({ maybe: false, arrayResult: false });
    },
    then(resolve, reject) {
      return execute({ maybe: false, arrayResult: true }).then(resolve, reject);
    },
  };

  function execute({ maybe, arrayResult }) {
    if (!tables[table]) tables[table] = [];
    if (state.operation === 'insert') {
      const payload = Array.isArray(state.payload) ? state.payload : [state.payload];
      const inserted = payload.map((row) => ({
        ...row,
        id: row.id || `${table}-${tables[table].length + 1}`,
      }));
      tables[table].push(...inserted);
      return Promise.resolve({ data: arrayResult ? inserted : inserted[0], error: null });
    }
    if (state.operation === 'update') {
      const matches = matchingRows();
      matches.forEach((row) => Object.assign(row, state.payload));
      return Promise.resolve({ data: arrayResult ? matches : matches[0] || null, error: null });
    }

    const rows = applyOrdering(matchingRows());
    const limited = state.limitCount ? rows.slice(0, state.limitCount) : rows;
    if (arrayResult) return Promise.resolve({ data: limited, error: null });
    if (limited.length === 0 && maybe) return Promise.resolve({ data: null, error: null });
    return Promise.resolve({ data: limited[0] || null, error: null });
  }

  function matchingRows() {
    return tables[table].filter((row) => (
      state.filters.every((filter) => row[filter.column] === filter.value)
    ));
  }

  function applyOrdering(rows) {
    return [...rows].sort((a, b) => {
      for (const order of state.orders) {
        const left = a[order.column];
        const right = b[order.column];
        if (left === right) continue;
        const result = left > right ? 1 : -1;
        return order.ascending ? result : -result;
      }
      return 0;
    });
  }

  return query;
}
