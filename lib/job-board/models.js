export function toJobSummary(job) {
  return {
    id: job.id,
    externalId: job.external_id,
    title: job.title,
    company: job.company,
    department: job.department,
    location: job.location,
    workplaceType: job.workplaceType || job.workplace_type || null,
    employmentType: job.employmentType || job.employment_type || null,
    careerCategory: job.careerCategory || job.career_category || 'other',
    salaryRange: job.salaryRange || job.salary_range || null,
    description: job.description || null,
    responsibilities: job.responsibilities || [],
    qualifications: job.qualifications || [],
    benefits: job.benefits || [],
    applyUrl: job.applyUrl || job.apply_url || null,
    postedAt: job.postedAt || job.posted_at || null,
    createdAt: job.createdAt || job.created_at || null,
    updatedAt: job.updatedAt || job.updated_at || null,
    source: job.source,
    sourceUrl: job.sourceUrl || job.source_url || null,
    saved: Boolean(job.saved),
    application: job.application || null,
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
