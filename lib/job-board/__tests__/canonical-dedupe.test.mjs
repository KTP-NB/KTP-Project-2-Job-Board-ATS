import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeJobRecord, createContentFingerprint, normalizeApplicationUrl } from '../ingestion/canonicalize.js';

test('normalizes application URLs by removing tracking and fragments', () => {
  assert.equal(
    normalizeApplicationUrl('https://jobs.example.com/apply/?utm_source=simplify&gh_src=abc&job=1#section'),
    'https://jobs.example.com/apply?job=1'
  );
});

test('unwraps safe redirect URL parameters without external requests', () => {
  const record = canonicalizeJobRecord({
    company: 'Acme',
    title: 'Software Engineer',
    sourcePostedDate: '2026-08-09T04:00:00.000Z',
    applicationUrl: 'https://simplify.jobs/redirect?url=https%3A%2F%2Fcareers.example.com%2Facme%2Fsoftware%3Futm_medium%3Djob',
  });

  assert.equal(record.canonicalUrl, 'https://careers.example.com/acme/software');
});

test('creates content fingerprint without location', () => {
  const first = createContentFingerprint({
    company: 'Acme Labs',
    title: 'Software Engineer I',
    location: 'New York, NY',
    sourcePostedDate: '2026-08-09T04:00:00.000Z',
  });
  const second = createContentFingerprint({
    company: 'Acme Labs',
    title: 'Software Engineer I',
    location: 'Remote',
    sourcePostedDate: '2026-08-09T04:00:00.000Z',
  });

  assert.equal(first, second);
  assert.equal(first, 'acme-labs:software-engineer-i:2026-08-09');
});
