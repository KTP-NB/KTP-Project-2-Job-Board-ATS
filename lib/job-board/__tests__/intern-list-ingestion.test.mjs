import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractApplicationId, extractSharedViewDataPath } from '../ingestion/internList/fetchAirtableView.js';
import { parseInternListAirtablePayload } from '../ingestion/internList/parseAirtableView.js';
import { runInternListIngestion } from '../ingestion/internList/runInternListIngestion.js';

test('extracts Airtable shared-view fetch metadata from public embed HTML', () => {
  const html = `
    <script>
      var headers = {"x-airtable-application-id":"appExample"};
      window.__stashedPrefetch = { urlWithParams: "\\u002Fv0.3\\u002Fview\\u002FviwExample\\u002FreadSharedViewData?accessPolicy=signed" };
    </script>
  `;

  assert.equal(extractApplicationId(html), 'appExample');
  assert.equal(extractSharedViewDataPath(html), '/v0.3/view/viwExample/readSharedViewData?accessPolicy=signed');
});

test('parses Intern List Airtable rows into canonical source records', () => {
  const records = parseInternListAirtablePayload(airtablePayload(), sourceRow(), {
    cycleStartedAt: '2026-08-25T12:00:00.000Z',
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].provider, 'intern_list');
  assert.equal(records[0].sourceExternalId, '6a8e02e725fc4e7ae3dbf3d7');
  assert.equal(records[0].company, 'Zip');
  assert.equal(records[0].title, 'Software Engineer Intern (Summer 2027)');
  assert.equal(records[0].careerCategory, 'software_engineering');
  assert.equal(records[0].employmentType, 'internship');
  assert.equal(records[0].workplaceType, 'hybrid');
  assert.equal(records[0].sourcePostedDate, '2026-08-25T04:00:00.000Z');
  assert.equal(records[0].applicationUrl, 'https://jobright.ai/jobs/info/6a8e02e725fc4e7ae3dbf3d7?utm_source=1099&utm_campaign=Software%20Engineer');
  assert.match(records[0].description, /Computer Science/);
});

test('Intern List ingestion runs one enabled source and upserts jobs', async () => {
  const service = createMemoryService({
    job_board_sources: [sourceRow()],
  });

  const summary = await runInternListIngestion({
    service,
    cycleStartedAt: '2026-08-25T12:00:00.000Z',
    fetcher: async (url) => {
      if (String(url).includes('/embed/')) return response(embedHtml());
      return response(airtablePayload(), { json: true });
    },
  });

  assert.equal(summary.sources, 1);
  assert.equal(summary.fetched, 1);
  assert.equal(summary.inserted, 1);
  assert.equal(summary.failed, 0);
  assert.equal(service.tables.job_board_jobs.length, 1);
  assert.equal(service.tables.job_board_jobs[0].source, 'intern_list');
  assert.equal(service.tables.job_board_jobs[0].employment_type, 'internship');
  assert.equal(service.tables.job_board_jobs[0].career_category, 'software_engineering');
  assert.equal(service.tables.job_board_source_links[0].provider, 'intern_list');
});

test('Intern List ingestion marks stalled sources failed without hanging the cycle', async () => {
  const service = createMemoryService({
    job_board_sources: [sourceRow()],
  });

  const summary = await runInternListIngestion({
    service,
    cycleStartedAt: '2026-08-25T12:00:00.000Z',
    timeoutMs: 1,
    fetcher: async (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }),
  });

  assert.equal(summary.sources, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.runs[0].status, 'failed');
  assert.match(summary.runs[0].error, /timed out/i);
  assert.equal(service.tables.job_board_ingestion_runs[0].status, 'failed');
  assert.equal(service.tables.job_board_ingestion_runs[0].errors[0].code, 'timeout');
});

function embedHtml() {
  return `
    <script>
      var headers = {"x-airtable-application-id":"appExample"};
      window.__stashedPrefetch = { urlWithParams: "\\u002Fv0.3\\u002Fview\\u002FviwExample\\u002FreadSharedViewData?accessPolicy=signed" };
    </script>
  `;
}

function airtablePayload() {
  const columns = [
    column('fldTitle', 'Position Title', 'multilineText'),
    column('fldDate', 'Date', 'multilineText'),
    column('fldApply', 'Apply', 'button'),
    column('fldWork', 'Work Model', 'select', {
      selHybrid: { id: 'selHybrid', name: 'Hybrid' },
    }),
    column('fldLocation', 'Location', 'multilineText'),
    column('fldCompany', 'Company', 'multilineText'),
    column('fldSalary', 'Salary', 'text'),
    column('fldHire', 'Hire Time', 'multilineText'),
    column('fldGrad', 'Graduate Time', 'multilineText'),
    column('fldIndustry', 'Company Industry', 'multiSelect', {
      selAi: { id: 'selAi', name: 'Artificial Intelligence (AI)' },
      selErp: { id: 'selErp', name: 'Enterprise Resource Planning (ERP)' },
    }),
    column('fldSize', 'Company Size', 'select'),
    column('fldQualifications', 'Qualifications', 'multilineText'),
  ];

  return {
    msg: 'SUCCESS',
    data: {
      table: {
        columns,
        rows: [{
          id: 'recZip',
          cellValuesByColumnId: {
            fldTitle: 'Software Engineer Intern (Summer 2027)',
            fldDate: '2026-08-25',
            fldApply: {
              label: 'Apply',
              url: 'https://jobright.ai/jobs/info/6a8e02e725fc4e7ae3dbf3d7?utm_source=1099&utm_campaign=Software%20Engineer',
            },
            fldWork: 'selHybrid',
            fldLocation: 'San Francisco, CA, United States',
            fldCompany: 'Zip',
            fldSalary: '$56-$60 /hr',
            fldHire: '2027-Summer',
            fldGrad: '2027-December / 2028-June',
            fldIndustry: ['selAi', 'selErp'],
            fldSize: '1001-5000',
            fldQualifications: 'Pursuing a BS or MS in Computer Science. Experience with React and GraphQL.',
          },
        }],
      },
    },
  };
}

function column(id, name, type, choices = null) {
  return {
    id,
    name,
    type,
    typeOptions: choices ? { choices } : null,
  };
}

function sourceRow(overrides = {}) {
  return {
    id: 'intern-list-swe',
    provider: 'intern_list',
    source_name: 'Intern List US Software Engineering Internships',
    repository_owner: 'intern-list',
    repository_name: 'us-swe',
    branch: 'main',
    source_url: 'https://www.intern-list.com/?selectedKey=Software%20Engineering',
    source_type: 'airtable_shared_view',
    source_classification: 'specialized',
    career_category: 'software_engineering',
    employment_type: 'internship',
    enabled: true,
    priority: 10,
    parser_version: 'intern-list-airtable-v1',
    last_attempt_at: null,
    last_success_at: null,
    consecutive_failures: 0,
    last_fetched_etag: null,
    metadata: {
      country: 'US',
      internListCategory: 'Software Engineering',
      airtableEmbedUrl: 'https://airtable.com/embed/appExample/shrExample?viewControls=on',
    },
    created_at: '2026-08-25T00:00:00.000Z',
    updated_at: '2026-08-25T00:00:00.000Z',
    ...overrides,
  };
}

function response(body, options = {}) {
  return {
    ok: true,
    status: 200,
    async text() {
      return String(body);
    },
    async json() {
      return options.json ? body : JSON.parse(body);
    },
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
      return execute(true);
    },
    single() {
      return execute(true, true);
    },
    then(resolve) {
      return execute(false).then(resolve);
    },
  };

  async function execute(single = false, requireSingle = false) {
    tables[table] ||= [];
    let rows = tables[table].filter((row) => state.filters.every((filter) => row[filter.column] === filter.value));

    if (state.operation === 'insert') {
      const inserted = { id: `${table}-${tables[table].length + 1}`, ...state.payload };
      tables[table].push(inserted);
      rows = [inserted];
    }

    if (state.operation === 'update') {
      rows = rows.map((row) => {
        Object.assign(row, state.payload);
        return row;
      });
    }

    for (const order of [...state.orders].reverse()) {
      rows = rows.slice().sort((a, b) => {
        const result = String(a[order.column] ?? '').localeCompare(String(b[order.column] ?? ''));
        return order.ascending ? result : -result;
      });
    }

    if (state.limitCount != null) rows = rows.slice(0, state.limitCount);

    if (single) {
      if (requireSingle && !rows[0]) return { data: null, error: new Error('No rows') };
      return { data: rows[0] || null, error: null };
    }
    return { data: rows, error: null };
  }

  return query;
}
