import { account } from './appwrite';

let jwtCache: { token: string; expiresAt: number } | null = null;

async function getJwt(): Promise<string> {
  if (jwtCache && jwtCache.expiresAt > Date.now() + 30_000) {
    return jwtCache.token;
  }
  const { jwt } = await account.createJWT();
  jwtCache = { token: jwt, expiresAt: Date.now() + 14 * 60 * 1000 };
  return jwt;
}

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const jwt = await getJwt();
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${jwt}`);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // body was not JSON
    }
    throw new AdminApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
