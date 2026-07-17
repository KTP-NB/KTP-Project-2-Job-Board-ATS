export function toJobSummary(job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    workplaceType: job.workplaceType || job.workplace_type,
    employmentType: job.employmentType || job.employment_type,
    postedAt: job.postedAt || job.posted_at,
    source: job.source,
  };
}

export function toApplicationSummary(application) {
  return {
    id: application.id,
    jobId: application.jobId || application.job_id,
    status: application.status,
    appliedAt: application.appliedAt || application.applied_at,
    updatedAt: application.updatedAt || application.updated_at,
  };
}
