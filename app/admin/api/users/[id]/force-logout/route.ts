import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const { users } = createAdminClient();
    await users.deleteSessions(id);

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
