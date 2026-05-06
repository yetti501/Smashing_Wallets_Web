export type ReportStatus = 'pending' | 'dismissed' | 'resolved';
export type ReportType = 'spam' | 'inappropriate' | 'scam' | 'other';

export type ReportDoc = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  listingId: string;
  reportedUserId: string;
  reportType: ReportType;
  description?: string;
  status: ReportStatus;
};

export type ListingPreview = {
  $id: string;
  title: string;
  status?: string;
  eventType?: string;
  images?: string[];
};

export type UserPreview = {
  $id: string;
  email: string;
  name?: string;
  status: boolean;
};

export type DecoratedReport = ReportDoc & {
  listing: ListingPreview | null;
  reporter: UserPreview | null;
  reportedUser: UserPreview | null;
};

export type UserListItem = {
  $id: string;
  email: string;
  name?: string;
  status: boolean;
  labels: string[];
  $createdAt: string;
};

export type UserDetail = {
  $id: string;
  email: string;
  name?: string;
  phone?: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  status: boolean;
  labels: string[];
  $createdAt: string;
  $updatedAt: string;
  registration?: string;
  accessedAt?: string;
};
