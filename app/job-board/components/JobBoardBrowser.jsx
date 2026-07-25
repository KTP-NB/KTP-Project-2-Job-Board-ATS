'use client';

import { useEffect, useMemo, useState } from 'react';
import { jobBoardApi } from '@/lib/job-board/clientFetch';
import { DEFAULT_JOBS_PER_PAGE, JOBS_PER_PAGE_OPTIONS } from '@/lib/job-board/constants';
import JobBoardEmptyState from './JobBoardEmptyState';
import JobCard from './JobCard';
import JobFilters from './JobFilters';
import JobPagination from './JobPagination';

export default function JobBoardBrowser({ savedOnly = false }) {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: DEFAULT_JOBS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState({
    search: '',
    category: '',
    employmentType: '',
    workplaceType: '',
    company: '',
    postedToday: false,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.page));
    params.set('perPage', String(pagination.perPage));
    if (savedOnly) params.set('saved', 'true');
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, String(value));
    }
    return params.toString();
  }, [pagination.page, pagination.perPage, query, savedOnly]);

  useEffect(() => {
    let isMounted = true;
    async function loadJobs() {
      setLoading(true);
      setError('');
      try {
        const data = await jobBoardApi(`/api/job-board/jobs?${queryString}`);
        if (!isMounted) return;
        setJobs(data.jobs || []);
        setFilters(data.filters || {});
        setPagination((current) => ({ ...current, ...data.pagination }));
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load jobs.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadJobs();
    return () => {
      isMounted = false;
    };
  }, [queryString]);

  const reloadFirstPage = () => {
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    setError('');
    try {
      const result = await jobBoardApi('/api/job-board/scrape/mock-careers', { method: 'POST' });
      setMessage(`Synced ${result.jobsCreated} new and ${result.jobsUpdated} updated jobs.`);
      reloadFirstPage();
    } catch (err) {
      setError(err.message || 'Unable to sync mock jobs.');
    } finally {
      setSyncing(false);
    }
  };

  const updateQuery = (updates) => {
    setQuery((current) => ({ ...current, ...updates }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const toggleSaved = async (job) => {
    const nextSaved = !job.saved;
    setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, saved: nextSaved } : item)));
    try {
      await jobBoardApi('/api/job-board/saved-jobs', {
        method: nextSaved ? 'POST' : 'DELETE',
        body: JSON.stringify({ jobId: job.id }),
      });
      if (savedOnly && !nextSaved) reloadFirstPage();
    } catch (err) {
      setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, saved: job.saved } : item)));
      setError(err.message || 'Unable to update saved job.');
    }
  };

  const updateApplication = async (job, status) => {
    try {
      const data = await jobBoardApi('/api/job-board/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          status,
          appliedAt: status === 'applied' ? new Date().toISOString() : job.application?.applied_at,
        }),
      });
      setJobs((current) => current.map((item) => (
        item.id === job.id ? { ...item, application: data.application } : item
      )));
    } catch (err) {
      setError(err.message || 'Unable to update application.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">
              Mock ingestion pipeline
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {savedOnly ? 'Saved Jobs' : 'Search Jobs'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-50/75">
              Sync from the internal mock careers API, then search and track roles from Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-full bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? 'Syncing...' : 'Sync mock jobs'}
          </button>
        </div>

        <JobFilters
          query={query}
          filters={filters}
          perPage={pagination.perPage}
          onQueryChange={updateQuery}
          onPerPageChange={(perPage) => setPagination((current) => ({ ...current, page: 1, perPage }))}
        />
      </div>

      {message ? <p className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]" />
          ))}
        </div>
      ) : jobs.length ? (
        <>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onToggleSaved={toggleSaved}
                onUpdateApplication={updateApplication}
              />
            ))}
          </div>
          <JobPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            perPage={pagination.perPage}
            onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          />
        </>
      ) : (
        <JobBoardEmptyState
          title={savedOnly ? 'No saved jobs yet' : 'No jobs found'}
          message={savedOnly ? 'Save jobs from the main Job Board search view.' : 'Try syncing mock jobs or clearing filters.'}
        />
      )}
    </div>
  );
}
