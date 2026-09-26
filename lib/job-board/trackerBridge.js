export function isJobBoardJobId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

export function jobBoardApplicationDraft(job, dateApplied) {
  return {
    company: job.company || '',
    position: job.title || '',
    date_applied: dateApplied,
    status: 'applied',
    details: '',
    application_url: job.applyUrl || '',
    referral: false,
    referral_contact: '',
  };
}
