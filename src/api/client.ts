import type {
  MembersGrouped,
  Member,
  ContentList,
  ContentItem,
  LiveStatus,
  YoutubeVideo,
  CalendarEvent,
} from './types';
import * as mock from './mockDb';

const USE_MOCK = import.meta.env.VITE_MOCK === 'true';
const BASE = '/api';

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

export const apiGetHistory = (limit = 50): Promise<ContentItem[]> =>
  USE_MOCK ? mock.mockGetHistory() : get('/history', { limit });

// ─── Live ─────────────────────────────────────────────────────────────────────

export const apiGetLiveStatus = (): Promise<LiveStatus[]> =>
  USE_MOCK ? mock.mockGetLiveStatus() : get('/live/status');

// ─── Calendar (Notion) ────────────────────────────────────────────────────────

export const apiGetCalendar = (): Promise<CalendarEvent[]> =>
  USE_MOCK ? mock.mockGetCalendar() : get('/calendar');

// ─── YouTube ──────────────────────────────────────────────────────────────────

/** Channel: UChU1YQle9vX1xRipUcBcR5g → uploads playlist: UUhU1YQle9vX1xRipUcBcR5g */
export const GGU_YOUTUBE_CHANNEL_ID = 'UChU1YQle9vX1xRipUcBcR5g';
export const GGU_UPLOADS_PLAYLIST_ID = GGU_YOUTUBE_CHANNEL_ID.replace(/^UC/, 'UU');

export const apiGetYoutubeLatest = (): Promise<{ items: YoutubeVideo[] }> =>
  USE_MOCK ? mock.mockGetYoutubeLatest() : get('/youtube/latest', { playlistId: GGU_UPLOADS_PLAYLIST_ID });
