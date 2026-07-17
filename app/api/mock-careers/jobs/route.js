import { NextResponse } from 'next/server';
import { getMockCareerJobsResponse } from '@/lib/mock-careers/jobs';

export function GET() {
  return NextResponse.json(getMockCareerJobsResponse());
}
