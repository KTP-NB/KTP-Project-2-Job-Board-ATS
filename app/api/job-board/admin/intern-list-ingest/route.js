import { NextResponse } from 'next/server';
import { requireJobBoardAdmin } from '@/lib/job-board/auth';
import { jsonError, readJson } from '@/lib/job-board/apiResponses';
import { runInternListIngestion } from '@/lib/job-board/ingestion/internList/runInternListIngestion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireJobBoardAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  try {
    const summary = await runInternListIngestion({ sourceId: body.sourceId || null });
    return NextResponse.json({ summary });
  } catch (error) {
    return jsonError(error.message || 'Intern List ingestion failed.', error.status || 500);
  }
}
