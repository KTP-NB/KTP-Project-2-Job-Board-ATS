import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isJobBoardJobId, jobBoardApplicationDraft } from '../trackerBridge.js';

test('accepts only a job UUID in tracker links', () => {
  assert.equal(isJobBoardJobId('4aa1226f-fcfe-4304-9b0d-c98e05900734'), true);
  assert.equal(isJobBoardJobId('123/../admin'), false);
});

test('prefills the existing application tracker without recording an application', () => {
  assert.deepEqual(jobBoardApplicationDraft({ company: 'Acme', title: 'Engineer', applyUrl: 'https://example.com/apply' }, '2026-09-26'), {
    company: 'Acme',
    position: 'Engineer',
    date_applied: '2026-09-26',
    status: 'applied',
    details: '',
    application_url: 'https://example.com/apply',
    referral: false,
    referral_contact: '',
  });
});
