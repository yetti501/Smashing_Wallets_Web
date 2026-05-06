import type { Models } from 'node-appwrite';
import { createSessionClient } from './appwrite-server';

export type AdminUser = Models.User<Models.Preferences> & {
  isMaster: boolean;
};

export class AdminAuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const ADMIN_LABEL = 'admin';

export function extractJwt(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!auth) return null;
  const match = /^Bearer (.+)$/.exec(auth);
  return match ? match[1] : null;
}

export async function requireAdmin(request: Request): Promise<AdminUser> {
  const jwt = extractJwt(request);
  if (!jwt) {
    throw new AdminAuthError(401, 'Missing authorization');
  }

  const masterEmail = process.env.MASTER_ADMIN_EMAIL;
  if (!masterEmail) {
    throw new AdminAuthError(500, 'Server misconfigured: MASTER_ADMIN_EMAIL not set');
  }

  let user: Models.User<Models.Preferences>;
  try {
    const { account } = createSessionClient(jwt);
    user = await account.get();
  } catch {
    throw new AdminAuthError(401, 'Invalid or expired session');
  }

  const isMaster = user.email === masterEmail;
  const hasAdminLabel = (user.labels ?? []).includes(ADMIN_LABEL);

  if (!isMaster && !hasAdminLabel) {
    throw new AdminAuthError(403, 'Not an admin');
  }

  return Object.assign(user, { isMaster });
}

export function isMasterEmail(email: string): boolean {
  return !!process.env.MASTER_ADMIN_EMAIL && email === process.env.MASTER_ADMIN_EMAIL;
}

export function adminErrorResponse(err: unknown): Response {
  if (err instanceof AdminAuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Internal error';
  console.error('[admin api] unexpected error', err);
  return Response.json({ error: message }, { status: 500 });
}
