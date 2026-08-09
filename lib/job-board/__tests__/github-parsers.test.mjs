import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSourceDate } from '../ingestion/dateNormalization.js';
import { parseJobrightRepository } from '../ingestion/github/parsers/jobright.js';
import { parseSimplifyRepository } from '../ingestion/github/parsers/simplify.js';

test('normalizes exact, today, relative, and year-rollover source dates', () => {
  const cycleStartedAt = '2026-08-09T12:00:00.000Z';
  assert.equal(normalizeSourceDate('Aug 08', { cycleStartedAt }).sourcePostedDate, '2026-08-08T04:00:00.000Z');
  assert.equal(normalizeSourceDate('Today', { cycleStartedAt }).sourcePostedDate, '2026-08-09T04:00:00.000Z');
  assert.equal(normalizeSourceDate('1d', { cycleStartedAt }).sourcePostedDate, '2026-08-08T04:00:00.000Z');

  const rollover = parseJobrightRepository(readFixture('jobright-year-rollover.md'), jobrightSource(), {
    cycleStartedAt: '2026-01-01T12:00:00.000Z',
  })[0];
  assert.equal(rollover.sourcePostedDate, '2025-12-31T05:00:00.000Z');
});

test('parses Jobright rows with source metadata and rejection reasons', () => {
  const records = parseJobrightRepository(readFixture('jobright-data-analysis.md'), jobrightSource(), {
    cycleStartedAt: '2026-08-09T12:00:00.000Z',
  });

  assert.equal(records.length, 4);
  assert.equal(records[0].provider, 'jobright');
  assert.equal(records[0].careerCategory, 'data_analytics');
  assert.equal(records[0].employmentType, 'new_grad');
  assert.equal(records[0].company, 'Acme Analytics');
  assert.equal(records[0].title, 'Data Analyst I');
  assert.equal(records[0].applicationUrl, 'https://careers.example.com/acme/data-analyst');
  assert.equal(records[0].workplaceType, 'hybrid');
  assert.equal(records[1].workplaceType, 'remote');
  assert.equal(records[2].rejected, true);
  assert.ok(records[2].rejectionReasons.includes('application_url_missing'));
  assert.ok(records[3].rejectionReasons.includes('title_missing'));
});

test('parses Simplify rows into the same intermediate schema', () => {
  const records = parseSimplifyRepository(readFixture('simplify-new-grad.md'), simplifySource(), {
    cycleStartedAt: '2026-08-09T12:00:00.000Z',
  });

  assert.equal(records.length, 4);
  assert.equal(records[0].provider, 'simplify');
  assert.equal(records[0].careerCategory, 'product_management');
  assert.equal(records[0].employmentType, 'new_grad');
  assert.equal(records[0].company, 'Nimbus');
  assert.equal(records[0].title, 'Associate Product Manager');
  assert.equal(records[0].applicationUrl, 'https://jobs.example.com/nimbus/apm');
  assert.equal(records[0].sourceDateRaw, '0d');
  assert.equal(records[1].applicationUrl, 'https://jobs.example.com/tradeco/quant?utm_source=simplify');
  assert.ok(records[2].rejectionReasons.includes('application_url_missing'));
  assert.ok(records[3].rejectionReasons.includes('company_missing'));
});

function readFixture(name) {
  return readFileSync(new URL(`../../../tests/fixtures/github/${name}`, import.meta.url), 'utf8');
}

function jobrightSource() {
  return {
    id: 'jobright-data',
    sourceName: 'Jobright Data',
    repositoryOwner: 'jobright-ai',
    repositoryName: '2026-Data-Analysis-New-Grad',
    careerCategory: 'data_analytics',
    employmentType: 'new_grad',
  };
}

function simplifySource() {
  return {
    id: 'simplify-new-grad',
    sourceName: 'Simplify Product',
    repositoryOwner: 'SimplifyJobs',
    repositoryName: 'New-Grad-Positions',
    careerCategory: 'product_management',
    employmentType: 'new_grad',
  };
}
