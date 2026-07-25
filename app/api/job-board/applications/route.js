import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { APPLICATION_STATUSES } from '@/lib/job-board/constants';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';
import { jsonError, readJson } from '@/lib/job-board/apiResponses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const service = getJobBoardServiceClient();
  const { data, error } = await service
    .from('job_board_applications')
    .select(`
      id, job_id, status, notes, applied_at, next_follow_up_at, updated_at,
      job_board_jobs ( id, title, company, location, workplace_type, employment_type, career_category, posted_at )
    `)
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ applications: data || [] });
}

export async function POST(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body.jobId) return jsonError('jobId is required.');

  const status = body.status || 'tracking';
  if (!APPLICATION_STATUSES.includes(status)) {
    return jsonError('Application status is invalid.');
  }

  const service = getJobBoardServiceClient();
  const { data, error } = await service
    .from('job_board_applications')
    .upsert({
      user_id: auth.user.id,
      job_id: body.jobId,
      status,
      notes: body.notes || null,
      applied_at: body.appliedAt || null,
      next_follow_up_at: body.nextFollowUpAt || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,job_id' })
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ application: data });
}
