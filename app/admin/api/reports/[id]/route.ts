import { createAdminClient } from '@/lib/appwrite-server';
import { adminErrorResponse, requireAdmin } from '@/lib/admin-auth';
import type {
  DecoratedReport,
  ListingPreview,
  ReportDoc,
  UserPreview,
} from '@/lib/admin-types';

function resolveImageUrl(ref: string): string {
  if (/^https?:\/\//i.test(ref)) return ref;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.APPWRITE_BUCKET_ID;
  if (!endpoint || !project || !bucket) return ref;
  return `${endpoint}/storage/buckets/${bucket}/files/${encodeURIComponent(ref)}/view?project=${project}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;

    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const reportsCollection = process.env.APPWRITE_COLLECTION_REPORTS_ID!;
    const listingsCollection = process.env.APPWRITE_COLLECTION_LISTINGS_ID!;

    const { databases, users } = createAdminClient();

    const report = (await databases.getDocument(
      databaseId,
      reportsCollection,
      id
    )) as unknown as ReportDoc;

    const [listingDoc, reporterUser, reportedUser] = await Promise.all([
      databases.getDocument(databaseId, listingsCollection, report.listingId).catch(() => null),
      report.userId === 'anonymous'
        ? Promise.resolve(null)
        : users.get(report.userId).catch(() => null),
      users.get(report.reportedUserId).catch(() => null),
    ]);

    let listing: ListingPreview | null = null;
    if (listingDoc) {
      const raw = listingDoc as unknown as {
        $id: string;
        title?: string;
        status?: string;
        eventType?: string;
        images?: unknown;
      };
      const rawImages = Array.isArray(raw.images) ? raw.images : [];
      const images = rawImages
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .map(resolveImageUrl);
      listing = {
        $id: raw.$id,
        title: raw.title ?? '(untitled)',
        status: raw.status,
        eventType: raw.eventType,
        images: images.length > 0 ? images : undefined,
      };
    }

    const decorated: DecoratedReport = {
      ...report,
      listing,
      reporter: reporterUser
        ? {
            $id: reporterUser.$id,
            email: reporterUser.email,
            name: reporterUser.name,
            status: reporterUser.status,
          }
        : null,
      reportedUser: reportedUser
        ? {
            $id: reportedUser.$id,
            email: reportedUser.email,
            name: reportedUser.name,
            status: reportedUser.status,
          }
        : null,
    };

    return Response.json({ report: decorated });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
