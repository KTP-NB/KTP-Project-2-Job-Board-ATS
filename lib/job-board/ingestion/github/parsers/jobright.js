import { normalizeSourceDate } from '../../dateNormalization.js';
import { extractMarkdownLink, parseMarkdownTables, stripMarkdown } from './markdownTable.js';

export function parseJobrightRepository(content, source, { cycleStartedAt } = {}) {
  return parseMarkdownTables(content).flatMap((table) => (
    table.rows.map((row, rowIndex) => toJobrightRecord(row, source, {
      cycleStartedAt,
      rowIndex,
    }))
  ));
}

function toJobrightRecord(row, source, { cycleStartedAt, rowIndex }) {
  const companyLink = extractMarkdownLink(row.company || '');
  const company = companyLink.label || row.company;
  const title = row.job_title || row.title || row.role;
  const date = normalizeSourceDate(row.date_posted || row.date || row.age, { cycleStartedAt });
  const applicationUrl = companyLink.url || extractMarkdownLink(row.application || '').url || '';
  const closed = isClosed(row) || !applicationUrl;
  const rejectionReasons = [];

  if (!company) rejectionReasons.push('company_missing');
  if (!title) rejectionReasons.push('title_missing');
  if (!applicationUrl) rejectionReasons.push('application_url_missing');
  if (!date.sourcePostedDate) rejectionReasons.push('source_posted_date_missing');

  return {
    provider: 'jobright',
    sourceId: source.id,
    sourceName: source.sourceName,
    repository: `${source.repositoryOwner}/${source.repositoryName}`,
    sourceRowIndex: rowIndex,
    sourceExternalId: applicationUrl || `${company}:${title}:${date.sourceDateRaw}`,
    company,
    title: stripMarkdown(title),
    location: row.location || '',
    workplaceType: normalizeWorkModel(row.work_model),
    applicationUrl,
    applyUrl: applicationUrl,
    sourcePostedDate: date.sourcePostedDate,
    sourceDateRaw: date.sourceDateRaw,
    careerCategory: source.careerCategory,
    employmentType: source.employmentType,
    status: closed ? 'closed' : 'open',
    notes: row.notes || '',
    raw: row,
    rejected: rejectionReasons.length > 0,
    rejectionReasons,
  };
}

function normalizeWorkModel(value) {
  const lower = String(value || '').toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('site') || lower.includes('office')) return 'onsite';
  return null;
}

function isClosed(row) {
  return Object.values(row || {}).some((value) => String(value || '').includes('🔒'));
}
