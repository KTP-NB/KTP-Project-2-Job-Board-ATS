# Job Board Integration

This branch is based on KTP-NB/ktp-website `master` at `91f11c3` and carries the Job Board feature from the separate Project 2 line. The main website repository has not been modified. The Project 2 repository retains its original `main` branch and this integration is on `integration/job-board-website`.

## Member workflow

- Members, pledges, inactive members, and alumni with an authenticated `access_role` may use the Job Board. The existing website login/session is authoritative. The Job Board does not impose active-status checks.
- Job Board cards link to the website's existing `/applications` tracker with a prefilled draft. Merely following the link does not create an application or count toward a monthly target.
- The old Job Board application endpoint is removed. `/job-board/applications` redirects to `/applications`.
- The single legacy Job Board application row in the linked project is a demo `/mock-careers` row; the one-time transfer script excludes it. Run `node scripts/migrate-legacy-job-board-applications.mjs` for a dry run before considering `--apply` on another database.
- Resume retrieval reads the website's `member_resumes` pointer and uses the existing protected storage path.

## Administration and ingestion

- `/admin` contains the Job Board tab for users with the existing `applications.manage` permission. Local development can use `NEXT_PUBLIC_JOB_BOARD_DEV_ADMIN_ENABLED=true`; this bypass is disabled in production.
- Intern List US internship sources and the H1B software-engineering source are active. Jobright/Simplify GitHub sources are manual backup sources; a single source can be run or disabled independently.
- Admins may add Jobright/Simplify GitHub README sources in the tab. New sources start disabled so their parser output can be reviewed before ingestion.
- Scheduled GitHub ingestion uses the Supabase `job-github-ingest` Edge Function and Cron; no OCI/Docker worker is needed for this path. Deployed GitHub ingestion requires `GITHUB_INGEST_TOKEN` and the internal Cron secret. Local unauthenticated fetching logs a warning.
- Jobright links without an extractable employer URL are labeled as Jobright links. They are not represented as direct employer applications.

## Deployment boundary

Do **not** run `supabase db push` from this branch as-is. On 2026-09-26, `supabase migration list` showed both remote-only website migration versions (starting `20260820201953`) and local-only website versions (for example `20260820202818`), plus other divergences. The live database already contains tables from both lines. First compare the SQL and resulting schema of each divergent version against the canonical website migration history, then create a reconciled migration directory or an explicitly reviewed repair plan. Avoid marking migrations applied solely to silence the CLI.

The Edge Function on this branch also contains the updated website role check. It has not been redeployed as part of this local integration. Deploy it only after migration reconciliation and verifying function secrets and Cron configuration in the target Supabase project.

## Verification

Run `npm run test:job-board`, `npm run test:members`, `npm run test:applications`, `npm run lint`, and `npm run build`. The Job Board APIs require a logged-in session; authenticated user journeys, admin actions, and actual email delivery need a browser session and test account in the target environment before production promotion. Local development runs with `npm run dev -- --port 3000`; dev output is isolated in `.next-dev`, so `npm run build` does not invalidate its CSS/chunks.
