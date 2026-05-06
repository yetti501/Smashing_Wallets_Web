import { createAdminClient } from '@/lib/appwrite-server';
import { ADMIN_LABEL, adminErrorResponse, requireAdmin } from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await requireAdmin(request);
    if (!requester.isMaster) {
      return Response.json({ error: 'Only the owner can promote admins' }, { status: 403 });
    }

    const { id } = await context.params;
    const { users } = createAdminClient();
    const target = await users.get(id);

    const labels = new Set([...(target.labels ?? []), ADMIN_LABEL]);
    await users.updateLabels(id, [...labels]);

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
