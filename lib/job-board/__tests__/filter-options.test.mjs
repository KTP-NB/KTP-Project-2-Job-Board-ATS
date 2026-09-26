import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadJobFilterOptions } from '../filterOptions.js';

test('filter options include companies beyond the first database page', async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => ({
    id: String(index),
    company: index === 1000 ? 'Zeta' : 'Acme',
    title: 'Intern',
    career_category: 'software_engineering',
    employment_type: 'internship',
    workplace_type: 'remote',
  }));
  const requested = [];
  const service = {
    from(table) {
      assert.equal(table, 'job_board_jobs');
      return {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        range(from, to) {
          requested.push(from);
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
        },
      };
    },
  };
  const options = await loadJobFilterOptions(service);
  assert.deepEqual(requested, [0, 1000]);
  assert.deepEqual(options.companies, ['Acme', 'Zeta']);
});
