import type { Models } from 'appwrite';

export const ADMIN_LABEL = 'admin';

export type AdminStatus = {
  isAdmin: boolean;
  isMaster: boolean;
};

export function getAdminStatus(
  user: Models.User<Models.Preferences> | null
): AdminStatus {
  if (!user) return { isAdmin: false, isMaster: false };
  const masterEmail = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL;
  const isMaster = !!masterEmail && user.email === masterEmail;
  const hasAdminLabel = (user.labels ?? []).includes(ADMIN_LABEL);
  return { isAdmin: isMaster || hasAdminLabel, isMaster };
}
