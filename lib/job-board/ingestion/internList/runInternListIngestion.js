import { getJobBoardServiceClient } from '../../supabaseServer.js';
import { getInternListSourceById, listEnabledInternListSources } from '../github/sourceRegistry.js';
import { upsertCanonicalJobs } from '../upsertCanonicalJobs.js';
import { withinLookback } from '../github/runGithubIngestion.js';
import { fetchInternListAirtableView } from './fetchAirtableView.js';
import { parseInternListAirtablePayload } from './parseAirtableView.js';

export async function runInternListIngestion(options = {}) {
  const service = options.service || getJobBoardServiceClient();
  const cycleStartedAt = options.cycleStartedAt || new Date().toISOString();
  const sources = options.sourceId
    ? [await getInternListSourceById(service, options.sourceId)].filter(Boolean)
    : await listEnabledInternListSources(service);

  const summary = {
    cycleStartedAt,
    sources: sources.length,
    fetched: 0,
    eligible: 0,
    accepted: 0,
    inserted: 0,
    updated: 0,
    duplicate: 0,
    rejected: 0,
    failed: 0,
    runs: [],
  };

  for (const source of sources) {
    const run = await createIngestionRun(service, source, cycleStartedAt);
    try {
      await markSourceAttempt(service, source.id, cycleStartedAt);
      const fetched = await fetchInternListAirtableView(source, {
        fetcher: options.fetcher,
        timeZone: options.timeZone,
      });
      const parsed = parseInternListAirtablePayload(fetched.payload, source, { cycleStartedAt });
      const eligible = parsed.filter((record) => withinLookback(record.sourcePostedDate || record.firstSeenAt, cycleStartedAt) || record.rejected);
      const upsert = await upsertCanonicalJobs(service, eligible, { cycleStartedAt });
      const rejected = eligible.filter((record) => record.rejected).length;

      await finishIngestionRun(service, run.id, {
        status: 'completed',
        fetchedCount: parsed.length,
        eligibleCount: eligible.length,
        acceptedCount: upsert.accepted,
        insertedCount: upsert.inserted,
        updatedCount: upsert.updated,
        duplicateCount: upsert.duplicate,
        rejectedCount: rejected,
        errors: eligible.filter((record) => record.rejected).map((record) => ({
          row: record.sourceRowIndex,
          reasons: record.rejectionReasons,
        })),
      });
      await markSourceSuccess(service, source.id, cycleStartedAt, fetched.sharedViewUrl);

      summary.fetched += parsed.length;
      summary.eligible += eligible.length;
      summary.accepted += upsert.accepted;
      summary.inserted += upsert.inserted;
      summary.updated += upsert.updated;
      summary.duplicate += upsert.duplicate;
      summary.rejected += rejected;
      summary.runs.push({ id: run.id, sourceId: source.id, status: 'completed' });
    } catch (error) {
      await finishIngestionRun(service, run.id, {
        status: 'failed',
        errorMessage: error.message,
        errors: [{ message: error.message, code: error.code || null, status: error.status || null }],
      });
      await markSourceFailure(service, source.id, cycleStartedAt);
      summary.failed += 1;
      summary.runs.push({ id: run.id, sourceId: source.id, status: 'failed', error: error.message });
    }
  }

  return summary;
}

async function createIngestionRun(service, source, cycleStartedAt) {
  const { data, error } = await service
    .from('job_board_ingestion_runs')
    .insert({
      source_id: source.id,
      provider: source.provider,
      source_name: source.sourceName,
      source_url: source.sourceUrl,
      status: 'running',
      cycle_started_at: cycleStartedAt,
      started_at: cycleStartedAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function finishIngestionRun(service, runId, result) {
  const { error } = await service
    .from('job_board_ingestion_runs')
    .update({
      status: result.status,
      fetched_count: result.fetchedCount || 0,
      eligible_count: result.eligibleCount || 0,
      accepted_count: result.acceptedCount || 0,
      inserted_count: result.insertedCount || 0,
      updated_count: result.updatedCount || 0,
      duplicate_count: result.duplicateCount || 0,
      rejected_count: result.rejectedCount || 0,
      error_message: result.errorMessage || null,
      errors: result.errors || [],
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);
  if (error) throw error;
}

async function markSourceAttempt(service, sourceId, timestamp) {
  const { error } = await service
    .from('job_board_sources')
    .update({ last_attempt_at: timestamp, updated_at: timestamp })
    .eq('id', sourceId);
  if (error) throw error;
}

async function markSourceSuccess(service, sourceId, timestamp, sharedViewUrl) {
  const payload = {
    last_success_at: timestamp,
    consecutive_failures: 0,
    updated_at: timestamp,
  };
  if (sharedViewUrl) payload.last_fetched_etag = sharedViewUrl;

  const { error } = await service
    .from('job_board_sources')
    .update(payload)
    .eq('id', sourceId);
  if (error) throw error;
}

async function markSourceFailure(service, sourceId, timestamp) {
  const { data } = await service
    .from('job_board_sources')
    .select('consecutive_failures')
    .eq('id', sourceId)
    .maybeSingle();

  const { error } = await service
    .from('job_board_sources')
    .update({
      consecutive_failures: Number(data?.consecutive_failures || 0) + 1,
      updated_at: timestamp,
    })
    .eq('id', sourceId);
  if (error) throw error;
}
