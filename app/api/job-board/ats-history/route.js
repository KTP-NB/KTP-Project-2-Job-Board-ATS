import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { listAnalyses } from '@/lib/job-board/ats/history';
import { jsonError } from '@/lib/job-board/apiResponses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  try {
    const analyses = await listAnalyses({ userId: auth.user.id });
    return NextResponse.json({ analyses });
  } catch (error) {
    return jsonError(error.message || 'Unable to load analysis history.', 500);
  }
}
