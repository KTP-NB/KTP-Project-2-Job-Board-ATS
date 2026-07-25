'use client';

import Link from 'next/link';
import { APPLICATION_STATUSES } from '@/lib/job-board/constants';

export default function JobCard({ job, onToggleSaved, onUpdateApplication }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-white shadow-lg backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-blue-200">{job.company}</p>
          <Link href={`/job-board/jobs/${job.id}`} className="mt-1 block text-2xl font-black tracking-tight hover:text-blue-100">
            {job.title}
          </Link>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-blue-50/75">{job.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-blue-50">
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{job.location}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{formatOption(job.workplaceType)}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{formatOption(job.employmentType)}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{formatOption(job.careerCategory)}</span>
            {isPostedToday(job.postedAt) ? <span className="rounded-full bg-emerald-500/25 px-3 py-1">Posted today</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:w-64 lg:flex-col">
          <button
            type="button"
            onClick={() => onToggleSaved(job)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              job.saved ? 'bg-white text-slate-950 hover:bg-blue-100' : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            {job.saved ? 'Saved' : 'Save job'}
          </button>
          <select
            value={job.application?.status || ''}
            onChange={(event) => event.target.value && onUpdateApplication(job, event.target.value)}
            className="rounded-full border border-white/15 bg-slate-950/40 px-4 py-2 text-sm font-bold text-white outline-none"
            aria-label="Application status"
          >
            <option value="">Track application</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>{formatOption(status)}</option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

function formatOption(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPostedToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}
