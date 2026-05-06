import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, isMasterEmail, requireAdmin } from '@/lib/admin-auth';
import type { ReportDoc, UserDetail } from '@/lib/admin-types';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const { users } = createAdminClient();
    const u = await users.get(id);

    const detail: UserDetail = {
      $id: u.$id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      emailVerification: u.emailVerification,
      phoneVerification: u.phoneVerification,
      status: u.status,
      labels: u.labels ?? [],
      $createdAt: u.$createdAt,
      $updatedAt: u.$updatedAt,
      registration: u.registration,
      accessedAt: u.accessedAt,
    };

    return Response.json({ user: detail });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const { users, databases } = createAdminClient();
    const target = await users.get(id);

    if (isMasterEmail(target.email)) {
      return Response.json({ error: 'Cannot delete the owner account' }, { status: 403 });
    }

    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const listingsCollection = process.env.APPWRITE_COLLECTION_LISTINGS_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;

    const userListings = await databases.listDocuments(databaseId, listingsCollection, [
      Query.equal('userId', id),
      Query.limit(500),
    ]);
    await Promise.all(
      userListings.documents.map((doc) =>
        databases.deleteDocument(databaseId, listingsCollection, doc.$id).catch((err) => {
          if (err?.code !== 404) throw err;
        })
      )
    );
    const deletedListings = userListings.documents.length;

    const openReports = await databases.listDocuments(databaseId, reportsCollection, [
      Query.equal('reportedUserId', id),
      Query.equal('status', 'pending'),
      Query.limit(500),
    ]);
    await Promise.all(
      (openReports.documents as unknown as ReportDoc[]).map((r) =>
        databases.updateDocument(databaseId, reportsCollection, r.$id, {
          status: 'resolved',
        })
      )
    );

    await users.delete(id);

    return Response.json({
      ok: true,
      deletedListings,
      resolvedReports: openReports.total,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
