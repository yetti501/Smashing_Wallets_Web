import { createAdminClient, createPublicClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const { users } = createAdminClient();
    const target = await users.get(id);

    const origin = new URL(request.url).origin;
    const recoveryUrl = `${origin}/reset-password`;

    const { account } = createPublicClient();
    await account.createRecovery(target.email, recoveryUrl);

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
