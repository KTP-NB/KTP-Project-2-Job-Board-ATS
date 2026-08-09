const ADMIN_POSITION_PATTERNS = ['vp of tech development', 'vp of prof development'];

export function positionIsJobBoardAdmin(position) {
  const value = String(position || '').toLowerCase();
  return ADMIN_POSITION_PATTERNS.some((pattern) => value.includes(pattern));
}

export function jobBoardDevAdminEnabled(env = process.env) {
  return env.NODE_ENV !== 'production' && (
    env.JOB_BOARD_DEV_ADMIN_ENABLED === 'true'
    || env.NEXT_PUBLIC_JOB_BOARD_DEV_ADMIN_ENABLED === 'true'
  );
}
