import type {
  MembersGrouped,
  Member,
  ContentList,
  ContentItem,
  LiveStatus,
  YoutubeVideo,
  CalendarEvent,
  ContentsArchiveItem,
  HistoryAchievement,
  NoticeStreamer,
  ChallengeBalloonTotal,
} from './types';
import * as mock from './mockDb';

const USE_MOCK = import.meta.env.VITE_MOCK === 'true';
// Prod: absolute backend URL (e.g. https://<railway>/api) via VITE_API_BASE_URL.
// Dev: unset -> '/api', served by the vite proxy to localhost:3000.
// Trailing slashes are stripped so `BASE + "/path"` never yields a double slash
// (e.g. VITE_API_BASE_URL="/" would otherwise produce "//schedule").
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ─── Members ─────────────────────────────────────────────────────────────────

export const apiGetMembers = async (): Promise<MembersGrouped> => {
  return USE_MOCK ? mock.mockGetMembers() : get<MembersGrouped>('/members');
};

export const apiGetMember = async (slug: string): Promise<Member> => {
  return USE_MOCK ? mock.mockGetMember(slug) : get<Member>(`/members/${slug}`);
};

// ─── Content ─────────────────────────────────────────────────────────────────

export const apiGetContent = (params?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ContentList> =>
  USE_MOCK
    ? mock.mockGetContent(params)
    : get('/content', params as Record<string, string | number>);

export const apiGetContentItem = (id: string): Promise<ContentItem> =>
  get(`/content/${id}`);

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const apiGetSchedule = (_upcomingOnly = false): Promise<ContentItem[]> =>
  USE_MOCK ? mock.mockGetSchedule() : get('/schedule', { upcoming: _upcomingOnly ? 'true' : 'false' });

// ─── History ──────────────────────────────────────────────────────────────────

export const apiGetHistory = (): Promise<HistoryAchievement[]> =>
  USE_MOCK ? mock.mockGetHistory() : get('/history');

// ─── Notice (SOOP 공지) ─────────────────────────────────────────────────────────

export const apiGetNotice = (): Promise<NoticeStreamer[]> =>
  USE_MOCK ? mock.mockGetNotice() : get('/notice');

// ─── SOOP 도전미션 별풍선 합계 ──────────────────────────────────────────────────
// 멤버별 '진행 중 도전미션에 모인 별풍선' 합계. 백엔드가 주기적으로 수집해 저장한 값을 읽는다.
// 응답은 LIVE 필터 없이 전체 SOOP 계정을 담으므로 요청한 soopId만 남겨 반환 계약을 유지한다.
// 소비자는 출처를 모른다(추상화).

export const apiGetChallengeBalloonTotals = async (
  soopIds: string[],
): Promise<ChallengeBalloonTotal[]> => {
  if (USE_MOCK) return mock.mockGetChallengeBalloonTotals(soopIds);
  if (soopIds.length === 0) return [];
  const all = await get<ChallengeBalloonTotal[]>('/challenge/balloons');
  const wanted = new Set(soopIds);
  return all.filter((t) => wanted.has(t.soopId));
};

// ─── Live ─────────────────────────────────────────────────────────────────────

export const apiGetLiveStatus = (): Promise<LiveStatus[]> =>
  USE_MOCK ? mock.mockGetLiveStatus() : get('/live/status');

// ─── Calendar (Notion) ────────────────────────────────────────────────────────

export const apiGetCalendar = (): Promise<CalendarEvent[]> =>
  USE_MOCK ? mock.mockGetCalendar() : get('/calendar');

// ─── Contents Archive (Notion) ───────────────────────────────────────────────

export const apiGetContentsArchive = async (): Promise<ContentsArchiveItem[]> => {
  if (USE_MOCK) return mock.mockGetContentsArchive();

  try {
    return await get('/contents');
  } catch (error) {
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      return mock.mockGetContentsArchive();
    }
    throw error;
  }
};

// ─── YouTube ──────────────────────────────────────────────────────────────────

/** Channel: UChU1YQle9vX1xRipUcBcR5g → uploads playlist: UUhU1YQle9vX1xRipUcBcR5g */
export const GGU_YOUTUBE_CHANNEL_ID = 'UChU1YQle9vX1xRipUcBcR5g';
export const GGU_UPLOADS_PLAYLIST_ID = GGU_YOUTUBE_CHANNEL_ID.replace(/^UC/, 'UU');

export const apiGetYoutubeLatest = (): Promise<{ items: YoutubeVideo[] }> =>
  USE_MOCK ? mock.mockGetYoutubeLatest() : get('/youtube/latest', { playlistId: GGU_UPLOADS_PLAYLIST_ID });
