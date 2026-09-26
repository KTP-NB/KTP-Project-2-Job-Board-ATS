import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOB_BOARD_NAV_LINKS } from '../navigation.js';

test('application tracker lives in Job Board navigation', () => {
  assert.ok(JOB_BOARD_NAV_LINKS.some((link) => link.href === '/job-board/applications' && link.label === 'Applications'));
  assert.equal(JOB_BOARD_NAV_LINKS.some((link) => link.href === '/applications'), false);
});
