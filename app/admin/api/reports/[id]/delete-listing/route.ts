import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';
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
    const listingsCollection = process.env.APPWRITE_COLLECTION_LISTINGS_ID!;

    const { databases } = createAdminClient();

    const report = (await databases.getDocument(
      databaseId,
      reportsCollection,
      id
    )) as unknown as ReportDoc;

    await databases
      .deleteDocument(databaseId, listingsCollection, report.listingId)
      .catch((err) => {
        if (err?.code !== 404) throw err;
      });

    const openReports = await databases.listDocuments(databaseId, reportsCollection, [
      Query.equal('listingId', report.listingId),
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
