import {
  APPLICATION_STATUSES,
  JOB_EMPLOYMENT_TYPES,
  JOB_STATUSES,
  JOB_WORKPLACE_TYPES,
} from './constants.js';

export function isAllowedValue(value, allowedValues) {
  return allowedValues.includes(String(value || '').trim());
}

export function normalizeSearchTerm(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function isValidJobStatus(value) {
  return isAllowedValue(value, JOB_STATUSES);
}

export function isValidApplicationStatus(value) {
  return isAllowedValue(value, APPLICATION_STATUSES);
}

export function validateJobDraft(job) {
  const errors = {};
  const title = normalizeSearchTerm(job?.title);
  const company = normalizeSearchTerm(job?.company);
  const location = normalizeSearchTerm(job?.location);
  const workplaceType = String(job?.workplaceType || job?.workplace_type || '').trim();
  const employmentType = String(job?.employmentType || job?.employment_type || '').trim();

  if (!title) errors.title = 'Job title is required.';
  if (!company) errors.company = 'Company is required.';
  if (!location) errors.location = 'Location is required.';
  if (workplaceType && !JOB_WORKPLACE_TYPES.includes(workplaceType)) {
    errors.workplaceType = 'Workplace type is invalid.';
  }
  if (employmentType && !JOB_EMPLOYMENT_TYPES.includes(employmentType)) {
    errors.employmentType = 'Employment type is invalid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
