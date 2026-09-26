import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';
import { jsonError } from '@/lib/job-board/apiResponses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const service = getJobBoardServiceClient();
  const { data, error } = await service
    .from('job_board_ats_analyses')
    .select('*, job_board_jobs ( id, title, company, location )')
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Analysis not found.', 404);
  return NextResponse.json({ analysis: data });
}
