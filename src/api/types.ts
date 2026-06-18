// ─── API response types matching the NestJS backend ──────────────────────────

export interface MediaAsset {
  assetId: string;
  storageProvider: 'S3' | 'EXTERNAL';
  publicUrl: string | null;
  altText: string | null;
}

export interface MemberRank {
  rankId: string;
  name: string;
  slug: 'master' | 'upper-rank' | 'lower-rank' | 'new' | string;
  displayOrder: number;
}

export interface PlatformAccount {
  accountId: string;
  externalUserId: string;
  displayName: string | null;
  channelUrl: string | null;
  isPrimary: boolean;
  platform: { code: string; name: string; baseUrl: string | null };
}

export interface Member {
  memberId: string;
  stageName: string;
  slug: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  rank: MemberRank | null;
  profileAsset: MediaAsset | null;
  platformAccounts: PlatformAccount[];
}

export interface MembersGrouped {
  master: Member[];
  upper: Member[];
  lower: Member[];
  new: Member[];
  other?: Member[];
}

export interface ContentAssetEntry {
  asset: MediaAsset;
  role: string;
  displayOrder: number;
}

export interface ContentItem {
  contentId: string;
  contentType: 'NEWS' | 'SCHEDULE' | 'GALLERY' | 'YOUTUBE' | 'NOTICE' | 'GAME_EVENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  title: string;
  summary: string | null;
  body: string | null;
  externalUrl: string | null;
  publishedAt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  displayOrder: number;
  category: { name: string; slug: string } | null;
  thumbnailAsset: MediaAsset | null;
  contentMembers: Array<{ member: Member }>;
  contentAssets?: ContentAssetEntry[];
}

export interface ContentList {
  total: number;
  items: ContentItem[];
}

export interface LiveStatus {
  accountId: string;
  memberId: string;
  memberName: string | null;
  memberSlug: string | null;
  profileImageUrl: string | null;
  rankSlug: string | null;
  channelUrl: string | null;
  platform: string;
  isLive: boolean;
  viewerCount: number | null;
  liveTitle: string | null;
  streamUrl: string | null;
  streamStatus: string;
  checkedAt: string | null;
}

export interface YoutubeVideo {
  title: string;
  videoId: string;
  publishedAt: string;
  thumbnail: string | null;
  link: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // ISO — "2026-06-18" or "2026-06-18T15:00:00.000Z"
  endDate: string;     // ISO end date (inclusive); empty string = single day
  tags: string[];
  members: string[];   // member stage names
  platform: string;
  url: string;
  memo: string;
}
