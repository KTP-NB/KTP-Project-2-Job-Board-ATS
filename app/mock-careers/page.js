import Link from 'next/link';
import { listMockCareerJobs } from '@/lib/mock-careers/jobs';

export const metadata = {
  title: 'Mock Careers | KTP Job Board',
  description: 'Internal mock careers site used for Job Board scraper development.',
};

export default function MockCareersPage() {
  const jobs = listMockCareerJobs();

  return (
    <main className="min-h-[80vh] px-4 pb-16 pt-28 md:px-6 md:pt-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">
            Internal scraper source
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">
            Mock Careers
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50/75 md:text-base">
            Realistic mock job postings that simulate external company career pages for the future MVP scraper.
          </p>
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/mock-careers/jobs/${job.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-white shadow-lg backdrop-blur transition hover:border-blue-200/40 hover:bg-white/[0.09]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-200">{job.company}</p>
                  <h2 className="mt-1 text-2xl font-black">{job.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-50/75">{job.summary}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-blue-50">
                  <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.location}</span>
                  <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.workplaceType}</span>
                  <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.employmentType}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
