import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('public member page reads only from the curated directory view', async () => {
  const source = await read('app/members/page.js');

  assert.match(source, /\.from\(['"]public_member_directory['"]\)/);
  assert.doesNotMatch(source, /\.from\(['"]member_profiles['"]\)/);
});

test('directory migration filters hidden profiles and revokes anonymous base-table access', async () => {
  const source = await read('supabase/migrations/20260924090000_public_member_directory_visibility.sql');

  assert.match(source, /where public_directory_visible = true/i);
  assert.match(source, /revoke select on public\.member_profiles from anon/i);
  assert.match(source, /grant select on public\.public_member_directory to anon, authenticated/i);
});

test('cohort registrations inherit directory visibility from their invite', async () => {
  const source = await read('app/api/join/[token]/route.js');

  assert.match(source, /public_directory_visible:\s*invite\.public_directory_visible !== false/);
});
