import { Query } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';
import type {
  DecoratedReport,
  ListingPreview,
  ReportDoc,
  ReportStatus,
  UserPreview,
} from '@/lib/admin-types';

const VALID_STATUSES: ReportStatus[] = ['pending', 'dismissed', 'resolved'];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status') ?? 'pending';
    const status = VALID_STATUSES.includes(statusParam as ReportStatus)
      ? (statusParam as ReportStatus)
      : 'pending';

    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;
    const listingsCollection = process.env.APPWRITE_COLLECTION_LISTINGS_ID!;

    const { databases, users } = createAdminClient();

    const reportsResponse = await databases.listDocuments(databaseId, reportsCollection, [
      Query.equal('status', status),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ]);

    const reports = reportsResponse.documents as unknown as ReportDoc[];

    const listingIds = [...new Set(reports.map((r) => r.listingId))];
    const reporterIds = [
      ...new Set(reports.map((r) => r.userId).filter((id) => id && id !== 'anonymous')),
    ];
    const reportedUserIds = [
      ...new Set(reports.map((r) => r.reportedUserId).filter(Boolean)),
    ];

    const [listingsResults, reporterResults, reportedUserResults] = await Promise.all([
      Promise.all(
        listingIds.map((id) =>
          databases.getDocument(databaseId, listingsCollection, id).catch(() => null)
        )
      ),
      Promise.all(reporterIds.map((id) => users.get(id).catch(() => null))),
      Promise.all(reportedUserIds.map((id) => users.get(id).catch(() => null))),
    ]);

    const listingMap = new Map<string, ListingPreview>();
    for (const doc of listingsResults) {
      if (doc) {
        listingMap.set(doc.$id, {
          $id: doc.$id,
          title: (doc as { title?: string }).title ?? '(untitled)',
          status: (doc as { status?: string }).status,
          eventType: (doc as { eventType?: string }).eventType,
        });
      }
    }

    const userMap = new Map<string, UserPreview>();
    for (const u of [...reporterResults, ...reportedUserResults]) {
      if (u) {
        userMap.set(u.$id, {
          $id: u.$id,
          email: u.email,
          name: u.name,
          status: u.status,
        });
      }
    }

    const decorated: DecoratedReport[] = reports.map((r) => ({
      ...r,
      listing: listingMap.get(r.listingId) ?? null,
      reporter: r.userId === 'anonymous' ? null : (userMap.get(r.userId) ?? null),
      reportedUser: userMap.get(r.reportedUserId) ?? null,
    }));

    return Response.json({ reports: decorated, total: reportsResponse.total });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
