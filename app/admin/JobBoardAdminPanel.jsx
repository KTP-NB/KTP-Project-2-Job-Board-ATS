'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Play, RefreshCw, Trash2 } from 'lucide-react';
import { jobBoardApi } from '@/lib/job-board/clientFetch';

const SOURCE_GROUPS = [
  { title: 'US internships', providers: ['intern_list'] },
  { title: 'H1B software engineering', providers: ['jobright_h1b'] },
  { title: 'Backup GitHub sources', providers: ['jobright', 'simplify'] },
];

export default function JobBoardAdminPanel() {
  const [sources, setSources] = useState([]);
  const [overview, setOverview] = useState(null);
  const [showDisabled, setShowDisabled] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const [sourceResult, overviewResult] = await Promise.all([
      jobBoardApi('/api/job-board/admin/sources'),
      jobBoardApi('/api/job-board/admin/overview'),
    ]);
    setSources(sourceResult.sources || []);
    setOverview(overviewResult);
  }, []);

  useEffect(() => {
    refresh().catch((err) => setError(err.message || 'Unable to load Job Board operations.'));
  }, [refresh]);

  async function run(label, action) {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      const result = await action();
      const summary = result?.summary || result;
      setMessage(`${label}: ${formatSummary(summary)}`);
      await refresh();
    } catch (err) {
      setError(err.message || `${label} failed.`);
    } finally {
      setBusy('');
    }
  }

  function runSource(source) {
    const endpoint = source.provider === 'intern_list'
      ? '/api/job-board/admin/intern-list-ingest'
      : '/api/job-board/admin/github-ingest';
    return run(source.source_name, () => jobBoardApi(endpoint, {
      method: 'POST',
      body: JSON.stringify({ sourceId: source.id }),
    }));
  }

  function toggleSource(source) {
    return run(source.source_name, () => jobBoardApi('/api/job-board/admin/sources', {
      method: 'PATCH',
      body: JSON.stringify({ sourceId: source.id, enabled: !source.enabled }),
    }));
  }

  function archivePostings() {
    if (!window.confirm('Archive all open Job Board postings? Saved jobs and application history will remain.')) return;
    run('Archive postings', () => jobBoardApi('/api/job-board/admin/jobs/clear', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'archive-job-postings' }),
    }));
  }

  return (
    <section className="space-y-7 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Job Board</h2>
          <p className="text-sm text-white/55">Source status and ingestion history</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => run('Refresh', refresh)} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"><RefreshCw size={16} /> Refresh</button>
          <button type="button" onClick={archivePostings} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={16} /> Archive postings</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}

      {overview && (
        <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-sm sm:grid-cols-4">
          <Metric label="Open jobs" value={overview.counts?.openJobs} />
          <Metric label="Saved jobs" value={overview.counts?.savedJobs} />
          <Metric label="Applications" value={overview.counts?.applications} />
          <Metric label="ATS analyses" value={overview.counts?.atsAnalyses} />
        </div>
      )}

      {SOURCE_GROUPS.map((group) => {
        const grouped = sources.filter((source) => group.providers.includes(source.provider));
        const visible = group.title === 'Backup GitHub sources' && !showDisabled
          ? grouped.filter((source) => source.enabled)
          : grouped;
        return (
          <section key={group.title} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold">{group.title} <span className="font-normal text-white/45">({grouped.filter((source) => source.enabled).length} enabled)</span></h3>
              {group.title === 'Backup GitHub sources' && <label className="flex items-center gap-2 text-sm text-white/65"><input type="checkbox" checked={showDisabled} onChange={(event) => setShowDisabled(event.target.checked)} /> Show disabled</label>}
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {visible.map((source) => (
                <div key={source.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{source.source_name}</p>
                    <p className="mt-1 text-xs text-white/50">{source.provider.replaceAll('_', ' ')} | Last success {formatDate(source.last_success_at)} | {source.consecutive_failures || 0} failures</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={source.source_url} target="_blank" rel="noreferrer" aria-label={`Open ${source.source_name}`} className="rounded-lg p-2 text-white/65 hover:bg-white/10"><ExternalLink size={16} /></a>
                    <button type="button" onClick={() => toggleSource(source)} disabled={Boolean(busy)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50">{source.enabled ? 'Disable' : 'Enable'}</button>
                    <button type="button" onClick={() => runSource(source)} disabled={Boolean(busy) || !source.enabled} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500 disabled:opacity-50"><Play size={14} /> Run</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h3 className="mb-3 text-base font-bold">Recent ingestion runs</h3>
        <div className="divide-y divide-white/10 border-y border-white/10 text-sm">
          {(overview?.ingestionRuns || []).map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between gap-2 py-3">
              <span>{item.source_name}</span>
              <span className="text-white/55">{item.status} | {item.inserted_count || 0} inserted | {formatDate(item.finished_at || item.started_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }) {
  return <div><p className="text-xs uppercase text-white/45">{label}</p><p className="mt-1 text-2xl font-bold">{value ?? '-'}</p></div>;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'never';
}

function formatSummary(summary) {
  if (typeof summary?.inserted === 'number') return `${summary.inserted} inserted, ${summary.updated || 0} updated, ${summary.failed || 0} failed`;
  if (typeof summary?.archivedJobs === 'number') return `${summary.archivedJobs} jobs archived`;
  return 'complete';
}
