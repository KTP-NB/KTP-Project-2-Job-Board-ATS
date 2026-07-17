import Link from 'next/link';
import JobBoardEmptyState from './components/JobBoardEmptyState';
import JobBoardStatCard from './components/JobBoardStatCard';

const upcomingActions = [
  'Browse curated jobs from the KTP network',
  'Save roles and track applications',
  'Run ATS resume checks against a job description',
  'Receive job recommendations and notification preferences',
];

export default function JobBoardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <JobBoardStatCard label="Saved jobs" value="0" />
        <JobBoardStatCard label="Applications" value="0" />
        <JobBoardStatCard label="ATS analyses" value="0" />
        <JobBoardStatCard label="Recommendations" value="0" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">
              Phase 1 foundation
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Job Board
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-blue-50/80 md:text-base">
              The protected member shell is ready. Backend job data, scraper output,
              ATS analysis, recommendations, and notifications will connect in later phases.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {upcomingActions.map((action) => (
              <div
                key={action}
                className="rounded-xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm font-semibold text-blue-50"
              >
                {action}
              </div>
            ))}
          </div>
        </div>

        <JobBoardEmptyState
          title="No saved jobs yet"
          message="Once job data is connected, saved roles and application activity will appear here."
          action={
            <Link
              href="/mock-careers"
              className="inline-flex rounded-full bg-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-400"
            >
              View mock careers
            </Link>
          }
        />
      </section>
    </div>
  );
}
