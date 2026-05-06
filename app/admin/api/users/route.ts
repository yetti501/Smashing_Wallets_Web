import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';
import type { UserListItem } from '@/lib/admin-types';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const search = url.searchParams.get('q')?.trim() ?? '';

    const { users } = createAdminClient();

    const queries = [Query.orderDesc('$createdAt'), Query.limit(50)];
    const response = search
      ? await users.list(queries, search)
      : await users.list(queries);

    const list: UserListItem[] = response.users.map((u) => ({
      $id: u.$id,
      email: u.email,
      name: u.name,
      status: u.status,
      labels: u.labels ?? [],
      $createdAt: u.$createdAt,
    }));

    return Response.json({ users: list, total: response.total });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
