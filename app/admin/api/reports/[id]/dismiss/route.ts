import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;

    const { databases } = createAdminClient();

    await databases.updateDocument(databaseId, reportsCollection, id, {
      status: 'dismissed',
    });

    return Response.json({ ok: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
