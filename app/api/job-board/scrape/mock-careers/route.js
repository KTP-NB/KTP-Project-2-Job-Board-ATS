import { NextResponse } from 'next/server';
import { requireJobBoardUser } from '@/lib/job-board/auth';
import { runScraper } from '@/lib/job-board/scraper/orchestrator';
import { mockCareersAdapter } from '@/lib/job-board/scraper/sources/mockCareers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth.error;

  const sourceUrl = new URL('/api/mock-careers/jobs', request.url).toString();
  const result = await runScraper({
    adapter: mockCareersAdapter,
    sourceUrl,
  });

  return NextResponse.json(result);
}
