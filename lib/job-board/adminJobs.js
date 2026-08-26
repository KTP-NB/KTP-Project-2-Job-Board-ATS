export async function archiveJobPostings(service, { now = new Date().toISOString() } = {}) {
  const { count, error: countError } = await service
    .from('job_board_jobs')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'archived');

  if (countError) throw countError;

  const { error } = await service
    .from('job_board_jobs')
    .update({
      status: 'archived',
      inactive_at: now,
      updated_at: now,
    })
    .neq('status', 'archived');

  if (error) throw error;

  return {
    archivedJobs: count || 0,
    archivedAt: now,
  };
}
