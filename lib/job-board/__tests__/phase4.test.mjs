import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionIsJobBoardAdmin } from '../adminAccess.js';
import { analyticsSummary } from '../events.js';
import { JOB_BOARD_NAV_LINKS } from '../navigation.js';

test('job board admin access uses existing VP rules', () => {
  assert.equal(positionIsJobBoardAdmin('VP of Tech Development'), true);
  assert.equal(positionIsJobBoardAdmin('VP of Prof Development'), true);
  assert.equal(positionIsJobBoardAdmin('President'), false);
  assert.equal(positionIsJobBoardAdmin('Member'), false);
});

test('analytics summary counts event types', async () => {
  const service = {
    from() {
      return {
        select() {
          return this;
        },
        gte() {
          return {
            data: [
              { event_type: 'job_saved' },
              { event_type: 'job_saved' },
              { event_type: 'ats_analysis_run' },
            ],
            error: null,
          };
        },
      };
    },
  };

  const summary = await analyticsSummary(service);
  assert.equal(summary.total, 3);
  assert.equal(summary.counts.job_saved, 2);
  assert.equal(summary.counts.ats_analysis_run, 1);
});

test('job board navigation exposes notifications as a top-level page', () => {
  assert.ok(JOB_BOARD_NAV_LINKS.some((link) => link.href === '/job-board/notifications' && link.label === 'Notifications'));
  assert.ok(JOB_BOARD_NAV_LINKS.some((link) => link.href === '/job-board/settings' && link.label === 'Settings'));
});
