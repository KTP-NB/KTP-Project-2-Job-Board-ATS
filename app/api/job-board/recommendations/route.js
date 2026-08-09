import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { jsonError } from '@/lib/job-board/apiResponses';
import { logJobBoardEvent } from '@/lib/job-board/events';
import { notifyRecommendations } from '@/lib/job-board/notifications';
import { refreshRecommendationsForUser } from '@/lib/job-board/recommendations';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const service = getJobBoardServiceClient();
  const { data, error } = await service
    .from('job_board_recommendations')
    .select('id, job_id, score, reasons, explanation, refreshed_at, job_board_jobs ( id, title, company, location, workplace_type, employment_type, career_category, posted_at, description )')
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .order('score', { ascending: false })
    .limit(25);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ recommendations: data || [] });
}

export async function POST(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  try {
    const service = getJobBoardServiceClient();
    const result = await refreshRecommendationsForUser(service, auth.user.id);
    const notifications = await notifyRecommendations(service, auth.user.id);
    await logJobBoardEvent(service, {
      userId: auth.user.id,
      eventType: 'recommendations_refreshed',
      entityType: 'recommendations',
      metadata: { ...result, notifications: notifications.generated },
    });
    return NextResponse.json({ ...result, notifications: notifications.generated });
  } catch (error) {
    return jsonError(error.message || 'Unable to refresh recommendations.', 500);
  }
}
