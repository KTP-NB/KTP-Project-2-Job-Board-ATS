import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMockCareerJob } from '@/lib/mock-careers/jobs';

export function generateMetadata({ params }) {
  const job = getMockCareerJob(params.id);
  if (!job) return { title: 'Job Not Found | Mock Careers' };
  return {
    title: `${job.title} | ${job.company}`,
    description: job.summary,
  };
}

export default function MockCareerJobPage({ params }) {
  const job = getMockCareerJob(params.id);
  if (!job) notFound();

  return (
    <main className="min-h-[80vh] px-4 pb-16 pt-28 md:px-6 md:pt-32 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-white shadow-xl backdrop-blur md:p-8">
        <Link href="/mock-careers" className="text-sm font-bold text-blue-200 hover:text-white">
          Back to mock careers
        </Link>

        <header className="mt-6 border-b border-white/10 pb-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">{job.company}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{job.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-blue-50">
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.department}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.location}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.workplaceType}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.employmentType}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.salaryRange}</span>
          </div>
          <p className="mt-5 text-base leading-7 text-blue-50/80">{job.summary}</p>
        </header>

        <JobSection title="Responsibilities" items={job.responsibilities} />
        <JobSection title="Qualifications" items={job.qualifications} />
        <JobSection title="Benefits" items={job.benefits} />
      </article>
    </main>
  );
}

function JobSection({ title, items }) {
  return (
    <section className="border-b border-white/10 py-6 last:border-b-0">
      <h2 className="text-xl font-black">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-blue-50/80">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-slate-950/25 px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
