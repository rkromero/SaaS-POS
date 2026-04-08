// Super admin identification — set SUPER_ADMIN_USER_IDS in .env as comma-separated Clerk user IDs
// Example: SUPER_ADMIN_USER_IDS=user_abc123,user_xyz456

export function isSuperAdmin(userId: string): boolean {
  const ids = (process.env.SUPER_ADMIN_USER_IDS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return ids.length > 0 && ids.includes(userId);
}
