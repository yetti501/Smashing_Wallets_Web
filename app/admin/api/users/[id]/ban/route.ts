import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, isMasterEmail, requireAdmin } from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const { users } = createAdminClient();
    const target = await users.get(id);

    if (isMasterEmail(target.email)) {
      return Response.json({ error: 'Cannot ban the owner account' }, { status: 403 });
    }

    await users.updateStatus(id, false);
    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
