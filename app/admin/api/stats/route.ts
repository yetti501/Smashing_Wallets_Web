import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { users, databases } = createAdminClient();
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const listingsCollection = process.env.APPWRITE_COLLECTION_LISTINGS_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    ).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const countQuery = (extra: string[]) => [...extra, Query.limit(1)];

    const [
      allUsers,
      signupsToday,
      signups7d,
      signups30d,
      activeListings,
      draftListings,
      cancelledListings,
      completedListings,
      pendingReports,
    ] = await Promise.all([
      users.list(countQuery([])),
      users.list(countQuery([Query.greaterThanEqual('$createdAt', startOfToday)])),
      users.list(countQuery([Query.greaterThanEqual('$createdAt', sevenDaysAgo)])),
      users.list(countQuery([Query.greaterThanEqual('$createdAt', thirtyDaysAgo)])),
      databases.listDocuments(
        databaseId,
        listingsCollection,
        countQuery([Query.equal('status', 'active')])
      ),
      databases.listDocuments(
        databaseId,
        listingsCollection,
        countQuery([Query.equal('status', 'draft')])
      ),
      databases.listDocuments(
        databaseId,
        listingsCollection,
        countQuery([Query.equal('status', 'cancelled')])
      ),
      databases.listDocuments(
        databaseId,
        listingsCollection,
        countQuery([Query.equal('status', 'completed')])
      ),
      databases.listDocuments(
        databaseId,
        reportsCollection,
        countQuery([Query.equal('status', 'pending')])
      ),
    ]);

    const listingsTotal =
      activeListings.total +
      draftListings.total +
      cancelledListings.total +
      completedListings.total;

    return Response.json({
      users: {
        total: allUsers.total,
        signupsToday: signupsToday.total,
        signups7d: signups7d.total,
        signups30d: signups30d.total,
      },
      listings: {
        total: listingsTotal,
        active: activeListings.total,
        draft: draftListings.total,
        cancelled: cancelledListings.total,
        completed: completedListings.total,
      },
      reports: {
        pending: pendingReports.total,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
