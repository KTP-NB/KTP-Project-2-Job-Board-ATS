import { normalizeSourceDate } from '../../dateNormalization.js';
import { extractMarkdownLink, parseMarkdownTables, stripMarkdown } from './markdownTable.js';

export function parseSimplifyRepository(content, source, { cycleStartedAt } = {}) {
  return parseMarkdownTables(content).flatMap((table) => (
    table.rows.map((row, rowIndex) => toSimplifyRecord(row, source, {
      cycleStartedAt,
      rowIndex,
    }))
  ));
}

function toSimplifyRecord(row, source, { cycleStartedAt, rowIndex }) {
  const application = extractMarkdownLink(row.application || '');
  const date = normalizeSourceDate(row.age || row.date_posted || row.date, { cycleStartedAt });
  const title = row.role || row.job_title || row.title;
  const company = stripMarkdown(row.company || '').replace(/^🔥\s*/, '');
  const applicationUrl = application.url;
  const closed = isClosed(row) || !applicationUrl;
  const rejectionReasons = [];

  if (!company || company === '↳') rejectionReasons.push('company_missing');
  if (!title) rejectionReasons.push('title_missing');
  if (!applicationUrl) rejectionReasons.push('application_url_missing');
  if (!date.sourcePostedDate) rejectionReasons.push('source_posted_date_missing');

  return {
    provider: 'simplify',
    sourceId: source.id,
    sourceName: source.sourceName,
    repository: `${source.repositoryOwner}/${source.repositoryName}`,
    sourceRowIndex: rowIndex,
    sourceExternalId: applicationUrl || `${company}:${title}:${date.sourceDateRaw}`,
    company,
    title: stripMarkdown(title),
    location: row.location || '',
    workplaceType: inferWorkplace(row.location),
    applicationUrl,
    applyUrl: applicationUrl,
    sourcePostedDate: date.sourcePostedDate,
    sourceDateRaw: date.sourceDateRaw,
    careerCategory: source.careerCategory,
    employmentType: source.employmentType,
    status: closed ? 'closed' : 'open',
    notes: '',
    raw: row,
    rejected: rejectionReasons.length > 0,
    rejectionReasons,
  };
}

function inferWorkplace(location) {
  const lower = String(location || '').toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  return null;
}

function isClosed(row) {
  return Object.values(row || {}).some((value) => String(value || '').includes('🔒'));
}
