import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubRecords, withinLookback } from '../ingestion/github/runGithubIngestion.js';

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
