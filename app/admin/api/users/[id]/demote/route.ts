import { createAdminClient } from '@/lib/appwrite-server';
import {
  ADMIN_LABEL,
  adminErrorResponse,
  isMasterEmail,
  requireAdmin,
} from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await requireAdmin(request);
    if (!requester.isMaster) {
      return Response.json({ error: 'Only the owner can demote admins' }, { status: 403 });
    }

    const { id } = await context.params;
    const { users } = createAdminClient();
    const target = await users.get(id);

    if (isMasterEmail(target.email)) {
      return Response.json({ error: 'Cannot demote the owner' }, { status: 403 });
    }

    const labels = (target.labels ?? []).filter((l) => l !== ADMIN_LABEL);
    await users.updateLabels(id, labels);

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
