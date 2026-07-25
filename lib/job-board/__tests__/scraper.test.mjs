import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeJobs } from '../scraper/dedupe.js';
import { normalizeJob } from '../scraper/normalize.js';
import { validateJobs } from '../scraper/validate.js';
import { mockCareersAdapter } from '../scraper/sources/mockCareers.js';

const rawJob = {
  id: 'northstar-software-engineer-intern-2027',
  company: 'Northstar Labs',
  title: 'Software Engineer Intern',
  department: 'Engineering',
  location: 'New York, NY',
  workplaceType: 'hybrid',
  employmentType: 'internship',
  summary: 'Build full-stack product features.',
  responsibilities: ['Ship React features.'],
  qualifications: ['Experience with JavaScript.'],
  postedAt: '2026-07-17T12:00:00.000Z',
};

test('normalizes raw jobs into database-ready shape', () => {
  const job = normalizeJob(rawJob, 'mock-careers');
  assert.equal(job.externalId, rawJob.id);
  assert.equal(job.source, 'mock-careers');
  assert.equal(job.workplaceType, 'hybrid');
  assert.equal(job.employmentType, 'internship');
  assert.equal(job.careerCategory, 'software_engineering');
  assert.ok(job.normalizedFingerprint.includes('northstar-labs'));
  assert.ok(job.normalizedKeywords.includes('software'));
});

test('validates normalized jobs and reports invalid rows', () => {
  const valid = normalizeJob(rawJob, 'mock-careers');
  const invalid = normalizeJob({ ...rawJob, id: '', title: '' }, 'mock-careers');
  const result = validateJobs([valid, invalid]);
  assert.equal(result.validJobs.length, 1);
  assert.equal(result.invalidJobs.length, 1);
  assert.equal(result.invalidJobs[0].errors.title, 'Job title is required.');
});

test('deduplicates jobs by source and external id', () => {
  const job = normalizeJob(rawJob, 'mock-careers');
  const result = dedupeJobs([job, { ...job }]);
  assert.equal(result.dedupedJobs.length, 1);
  assert.equal(result.duplicates.length, 1);
});

test('mock careers adapter fetches jobs through HTTP-shaped fetcher', async () => {
  const jobs = await mockCareersAdapter.fetchJobs({
    url: 'https://example.test/api/mock-careers/jobs',
    fetcher: async (url) => ({
      ok: url.includes('/api/mock-careers/jobs'),
      status: 200,
      async json() {
        return { jobs: [rawJob] };
      },
    }),
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].id, rawJob.id);
});
