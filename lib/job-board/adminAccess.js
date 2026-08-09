const ADMIN_POSITION_PATTERNS = ['vp of tech development', 'vp of prof development'];

export function positionIsJobBoardAdmin(position) {
  const value = String(position || '').toLowerCase();
  return ADMIN_POSITION_PATTERNS.some((pattern) => value.includes(pattern));
}
