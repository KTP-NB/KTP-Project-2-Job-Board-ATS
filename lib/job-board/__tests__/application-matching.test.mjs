import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchTrackedApplicationsToJobs } from '../recommendations.js';

test('matches website tracker applications to a unique Job Board URL', () => {
  const jobs = [{ id: 'a', company: 'Acme', title: 'Engineer', apply_url: 'https://jobs.example.com/123' }];
  const apps = [{ company: 'Acme', position: 'Engineer', application_url: 'https://jobs.example.com/123?utm_source=ktp' }];
  assert.deepEqual(matchTrackedApplicationsToJobs(jobs, apps).map((job) => job.id), ['a']);
});

test('does not guess between two jobs with the same title and company', () => {
  const jobs = [
    { id: 'a', company: 'Acme', title: 'Engineer', apply_url: 'https://jobs.example.com/123' },
    { id: 'b', company: 'Acme', title: 'Engineer', apply_url: 'https://jobs.example.com/456' },
  ];
  const apps = [{ company: 'Acme', position: 'Engineer', application_url: null }];
  assert.deepEqual(matchTrackedApplicationsToJobs(jobs, apps), []);
});
