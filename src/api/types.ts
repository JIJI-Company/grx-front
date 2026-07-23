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
  tmi?: string | null;
  mbti?: string | null;
  birth?: string | null;
  hashTag?: string | null;
  isActive: boolean;
  displayOrder: number;
  rank: MemberRank | null;
  profileAsset: MediaAsset | null;
  platformAccounts: PlatformAccount[];
  personalColor?: string | null;
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
  contentType:
    | 'NEWS'
    | 'SCHEDULE'
    | 'CALENDAR'
    | 'GALLERY'
    | 'YOUTUBE'
    | 'NOTICE'
    | 'GAME_EVENT';
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
  liveThumbnailUrl: string | null;
  streamUrl: string | null;
  streamStatus: string;
  checkedAt: string | null;
  personalColor?: string | null;
}

export interface YoutubeVideo {
  title: string;
  videoId: string;
  publishedAt: string;
  thumbnail: string | null;
  link: string;
}

export interface HistoryAchievement {
  id: string;
  title: string;       // 수상명 (예: "육창서버")
  category: string;    // Notion category (예: "롤", "멀티")
  medal: 'gold' | 'silver' | 'bronze' | '';
  date: string;        // ISO — "2025-10-26"
  members: string[];   // member names
  image: string | null;
}

export interface NoticeItem {
  id: string;          // SOOP title_no
  title: string;
  date: string;        // "2026-06-22 18:28:32"
  thumbnail: string | null;
  url: string;         // 개별 글 링크
  readCount: number;
  commentCount: number;
}

export interface NoticeStreamer {
  soopId: string;
  name: string;
  color: string;
  avatar: string;
  boardUrl: string;    // 게시판 링크
  notices: NoticeItem[];
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

export interface ContentsArchiveItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string | null;
  members: string[];
  tags: string[];
  url: string;
}

export interface ChallengeBalloonTotal {
  soopId: string;
  balloonTotal: number | null; // 진행 중 도전미션 모금 별풍선 합. 관측된 적 없으면 null (0과 구분)
  missionTitle: string | null; // 진행 중 도전미션 제목. 없으면 null
  updatedAt: string | null; // 마지막 관측 시각(ISO). 관측된 적 없으면 null
}
