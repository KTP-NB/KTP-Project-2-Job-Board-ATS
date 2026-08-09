import { NextResponse } from 'next/server';
import { extractAccessToken, getJobBoardServiceClient, getJobBoardUserClient } from './supabaseServer';
import { positionIsJobBoardAdmin } from './adminAccess';

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

export async function requireJobBoardAdmin(request) {
  const auth = await requireJobBoardUser(request);
  if (auth.error) return auth;

  const service = getJobBoardServiceClient();
  const { data: profile, error } = await service
    .from('member_profiles')
    .select('position')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: 'Admin lookup failed' }, { status: 500 }) };
  }

  if (!positionIsJobBoardAdmin(profile?.position)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ...auth, profile };
}

export { positionIsJobBoardAdmin };
