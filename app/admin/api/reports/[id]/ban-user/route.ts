import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, AdminAuthError, requireAdmin, isMasterEmail } from '@/lib/admin-auth';
import type { ReportDoc } from '@/lib/admin-types';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;

    const { databases, users } = createAdminClient();

    const report = (await databases.getDocument(
      databaseId,
      reportsCollection,
      id
    )) as unknown as ReportDoc;

    const targetUser = await users.get(report.reportedUserId);

    if (isMasterEmail(targetUser.email)) {
      throw new AdminAuthError(403, 'Cannot ban the owner account');
    }

    await users.updateStatus(targetUser.$id, false);

    const openReports = await databases.listDocuments(databaseId, reportsCollection, [
      Query.equal('reportedUserId', report.reportedUserId),
      Query.equal('status', 'pending'),
      Query.limit(100),
    ]);

    await Promise.all(
      (openReports.documents as unknown as ReportDoc[]).map((r) =>
        databases.updateDocument(databaseId, reportsCollection, r.$id, {
          status: 'resolved',
        })
      )
    );

    return Response.json({ ok: true, resolvedCount: openReports.total });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
