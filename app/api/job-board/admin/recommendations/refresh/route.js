import { NextResponse } from 'next/server';
import { requireJobBoardAdmin } from '@/lib/job-board/auth';
import { jsonError } from '@/lib/job-board/apiResponses';
import { generateDigestNotifications } from '@/lib/job-board/notifications';
import { refreshRecommendationsForAllUsers } from '@/lib/job-board/recommendations';
import { getJobBoardServiceClient } from '@/lib/job-board/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireJobBoardAdmin(request);
  if (auth.error) return auth.error;

  try {
    const service = getJobBoardServiceClient();
    const recommendations = await refreshRecommendationsForAllUsers(service);
    const digest = await generateDigestNotifications(service);
    return NextResponse.json({ recommendations, digest });
  } catch (error) {
    return jsonError(error.message || 'Unable to refresh recommendations.', 500);
  }
}
