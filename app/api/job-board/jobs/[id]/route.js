import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';
import { toJobSummary } from '@/lib/job-board/models';
import { logJobBoardEvent } from '@/lib/job-board/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const service = getJobBoardServiceClient();
  const { data: job, error } = await service
    .from('job_board_jobs')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'open')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  await logJobBoardEvent(service, {
    userId: auth.user.id,
    eventType: 'job_viewed',
    entityType: 'job',
    entityId: job.id,
  });

  const [{ data: saved }, { data: application }] = await Promise.all([
    service
      .from('job_board_saved_jobs')
      .select('id')
      .eq('user_id', auth.user.id)
      .eq('job_id', job.id)
      .maybeSingle(),
    service
      .from('job_board_applications')
      .select('id, job_id, status, notes, applied_at, next_follow_up_at, updated_at')
      .eq('user_id', auth.user.id)
      .eq('job_id', job.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    job: toJobSummary({
      ...job,
      saved: Boolean(saved),
      application: application || null,
    }),
  });
}
