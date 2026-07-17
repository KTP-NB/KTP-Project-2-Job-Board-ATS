import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMockCareerJob,
  getMockCareerJobsResponse,
  listMockCareerJobs,
  mockCareerJobs,
} from '../jobs.js';

test('mock careers jobs have stable unique ids', () => {
  const ids = new Set(mockCareerJobs.map((job) => job.id));
  assert.equal(ids.size, mockCareerJobs.length);
});

test('mock careers jobs include scraper-ready fields', () => {
  for (const job of mockCareerJobs) {
    assert.ok(job.id);
    assert.ok(job.company);
    assert.ok(job.title);
    assert.ok(job.location);
    assert.ok(job.department);
    assert.ok(job.summary);
    assert.ok(Array.isArray(job.responsibilities));
    assert.ok(Array.isArray(job.qualifications));
    assert.ok(job.applyUrl.includes(job.id));
  }
});

test('lists newest mock jobs first', () => {
  const jobs = listMockCareerJobs();
  assert.ok(new Date(jobs[0].postedAt) >= new Date(jobs[jobs.length - 1].postedAt));
});

test('returns API-shaped mock careers payload', () => {
  const payload = getMockCareerJobsResponse();
  assert.equal(payload.count, mockCareerJobs.length);
  assert.equal(payload.source, 'mock-careers');
  assert.equal(getMockCareerJob(payload.jobs[0].id)?.id, payload.jobs[0].id);
});
