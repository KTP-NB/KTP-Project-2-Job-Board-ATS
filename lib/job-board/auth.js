import { NextResponse } from 'next/server';
import { extractAccessToken, getJobBoardServiceClient, getJobBoardUserClient } from './supabaseServer';
import { jobBoardDevAdminEnabled, positionIsJobBoardAdmin } from './adminAccess';
import { isAuthServiceUnavailable } from './authErrors';

export async function requireJobBoardUser(request) {
  const token = extractAccessToken(request);
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  let data;
  let error;

  try {
    const userClient = getJobBoardUserClient(token);
    ({ data, error } = await userClient.auth.getUser());
  } catch (err) {
    console.error('Job Board auth validation failed:', err);
    return {
      error: NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 },
      ),
    };
  }

  if (isAuthServiceUnavailable(error)) {
    console.error('Job Board auth service unavailable:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 },
      ),
    };
  }

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
    if (jobBoardDevAdminEnabled()) {
      return { ...auth, profile, devAdmin: true };
    }
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ...auth, profile };
}

export { jobBoardDevAdminEnabled, positionIsJobBoardAdmin };
