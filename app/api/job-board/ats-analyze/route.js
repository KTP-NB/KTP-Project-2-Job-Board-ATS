import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { jsonError, readJson } from '@/lib/job-board/apiResponses';
import { analyzeForJob, analyzeForRole } from '@/lib/job-board/ats/analyze';
import { ROLE_PROFILES } from '@/lib/job-board/ats/taxonomy';
import { logJobBoardEvent } from '@/lib/job-board/events';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);

  try {
    if (body.jobId) {
      const analysis = await analyzeForJob({ userId: auth.user.id, jobId: body.jobId });
      await logJobBoardEvent(getJobBoardServiceClient(), {
        userId: auth.user.id,
        eventType: 'ats_analysis_run',
        entityType: 'job',
        entityId: body.jobId,
        metadata: { score: analysis.score, mode: 'job' },
      });
      return NextResponse.json({ analysis });
    }

    const targetRole = body.targetRole || 'software_engineering';
    if (!ROLE_PROFILES[targetRole]) {
      return jsonError('Target role is invalid.');
    }

    const analysis = await analyzeForRole({ userId: auth.user.id, targetRole });
    await logJobBoardEvent(getJobBoardServiceClient(), {
      userId: auth.user.id,
      eventType: 'ats_analysis_run',
      entityType: 'ats_analysis',
      entityId: analysis.id,
      metadata: { score: analysis.score, mode: 'general', targetRole },
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    return jsonError(error.message || 'ATS analysis failed.', error.status || 500);
  }
}
