import { canonicalizeJobRecord } from './canonicalize.js';

export async function upsertCanonicalJobs(service, records, { cycleStartedAt } = {}) {
  const now = cycleStartedAt || new Date().toISOString();
  const accepted = records.filter((record) => !record.rejected).map(canonicalizeJobRecord);
  const rows = [];
  let inserted = 0;
  let updated = 0;
  let duplicate = 0;

  for (const record of accepted) {
    const existing = await findExistingCanonicalJob(service, record);
    const payload = toJobPayload(record, now, existing);

    let job;
    if (existing) {
      const { data, error } = await service
        .from('job_board_jobs')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      job = data;
      updated += 1;
      duplicate += 1;
    } else {
      const { data, error } = await service
        .from('job_board_jobs')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      job = data;
      inserted += 1;
    }

    await upsertSourceLink(service, job.id, record, now);
    rows.push(job);
  }

  return {
    accepted: accepted.length,
    rejected: records.length - accepted.length,
    inserted,
    updated,
    duplicate,
    rows,
  };
}

async function findExistingCanonicalJob(service, record) {
  const linked = await findBySourceLink(service, record);
  if (linked) return linked;

  if (record.canonicalUrl) {
    const { data, error } = await service
      .from('job_board_jobs')
      .select('*')
      .eq('canonical_url', record.canonicalUrl)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (record.normalizedApplicationUrl && record.normalizedApplicationUrl !== record.canonicalUrl) {
    const { data, error } = await service
      .from('job_board_jobs')
      .select('*')
      .eq('canonical_url', record.normalizedApplicationUrl)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (record.contentFingerprint) {
    const { data, error } = await service
      .from('job_board_jobs')
      .select('*')
      .eq('content_fingerprint', record.contentFingerprint)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  return null;
}

async function findBySourceLink(service, record) {
  const { data, error } = await service
    .from('job_board_source_links')
    .select('job_id')
    .eq('source_id', record.sourceId)
    .eq('source_external_id', record.sourceExternalId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.job_id) return null;

  const { data: job, error: jobError } = await service
    .from('job_board_jobs')
    .select('*')
    .eq('id', data.job_id)
    .maybeSingle();
  if (jobError) throw jobError;
  return job;
}

function toJobPayload(record, now, existing) {
  const payload = {
    external_id: existing?.external_id || record.contentFingerprint || record.sourceExternalId,
    source: existing?.source || 'github',
    source_url: existing?.source_url || record.applicationUrl || record.sourceUrl || null,
    company: best(existing?.company, record.company),
    title: best(existing?.title, record.title),
    department: existing?.department || null,
    location: best(existing?.location, record.location || 'Multiple locations'),
    workplace_type: best(existing?.workplace_type, record.workplaceType || inferWorkplace(record.location)),
    employment_type: best(existing?.employment_type, record.employmentType),
    career_category: best(existing?.career_category, record.careerCategory),
    description: existing?.description || record.description || null,
    apply_url: best(existing?.apply_url, record.applicationUrl || record.applyUrl),
    status: record.status === 'closed' ? 'closed' : (existing?.status || 'open'),
    posted_at: existing?.posted_at || record.sourcePostedDate || now,
    scraped_at: now,
    last_seen_at: now,
    inactive_at: record.status === 'closed' ? now : (existing?.inactive_at || null),
    normalized_fingerprint: existing?.normalized_fingerprint || record.contentFingerprint,
    canonical_url: best(existing?.canonical_url, record.canonicalUrl || record.normalizedApplicationUrl),
    content_fingerprint: best(existing?.content_fingerprint, record.contentFingerprint),
    source_payload: {
      ...(existing?.source_payload || {}),
      latest_github_record: compactSourceRecord(record),
    },
    updated_at: now,
  };

  return payload;
}

async function upsertSourceLink(service, jobId, record, now) {
  const { data: existing, error: lookupError } = await service
    .from('job_board_source_links')
    .select('id, first_seen_at')
    .eq('source_id', record.sourceId)
    .eq('source_external_id', record.sourceExternalId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const payload = {
      job_id: jobId,
      source_id: record.sourceId,
      provider: record.provider,
      source_url: record.sourceUrl || record.applicationUrl || null,
      source_external_id: record.sourceExternalId,
      canonical_url: record.canonicalUrl || null,
      raw_payload: compactSourceRecord(record),
      source_posted_date: record.sourcePostedDate || null,
      last_seen_at: now,
      updated_at: now,
  };

  if (existing) {
    const { error } = await service
      .from('job_board_source_links')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await service
    .from('job_board_source_links')
    .insert({ ...payload, first_seen_at: now });
  if (error) throw error;
}

function compactSourceRecord(record) {
  return {
    provider: record.provider,
    sourceId: record.sourceId,
    sourceName: record.sourceName,
    repository: record.repository,
    sourceRowIndex: record.sourceRowIndex,
    sourceDateRaw: record.sourceDateRaw,
    sourcePostedDate: record.sourcePostedDate,
    applicationUrl: record.applicationUrl,
    company: record.company,
    title: record.title,
    location: record.location,
    raw: record.raw,
  };
}

function best(existingValue, newValue) {
  return existingValue || newValue || null;
}

function inferWorkplace(location) {
  const lower = String(location || '').toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'onsite';
}
