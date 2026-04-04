/**
 * Super Admin utilities
 * Determines super admin status via SUPER_ADMIN_EMAILS env var.
 */

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const superAdmins = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return superAdmins.includes(email.toLowerCase());
}
