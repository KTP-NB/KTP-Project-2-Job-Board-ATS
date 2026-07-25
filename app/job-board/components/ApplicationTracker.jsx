'use client';

import { useEffect, useState } from 'react';
import { jobBoardApi } from '@/lib/job-board/clientFetch';
import JobBoardEmptyState from './JobBoardEmptyState';

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadApplications() {
      try {
        const data = await jobBoardApi('/api/job-board/applications');
        if (isMounted) setApplications(data.applications || []);
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load applications.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadApplications();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]" />;
  }

  if (error) {
    return <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{error}</p>;
  }

  if (!applications.length) {
    return (
      <JobBoardEmptyState
        title="No tracked applications yet"
        message="Use the status dropdown on a job card to start tracking applications."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <article key={application.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-white shadow-lg backdrop-blur">
          <p className="text-sm font-bold text-blue-200">{application.job_board_jobs?.company}</p>
          <h2 className="mt-1 text-2xl font-black">{application.job_board_jobs?.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-blue-50">
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{formatOption(application.status)}</span>
            <span className="rounded-full bg-blue-500/25 px-3 py-1">{application.job_board_jobs?.location}</span>
            {application.applied_at ? <span className="rounded-full bg-blue-500/25 px-3 py-1">Applied {formatDate(application.applied_at)}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function formatOption(value) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}
