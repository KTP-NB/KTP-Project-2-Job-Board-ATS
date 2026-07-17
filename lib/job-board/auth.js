import { NextResponse } from 'next/server';
import { extractAccessToken, getJobBoardUserClient } from './supabaseServer';

export async function requireJobBoardUser(request) {
  const token = extractAccessToken(request);
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const userClient = getJobBoardUserClient(token);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    return { error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  return { user: data.user, token };
}
