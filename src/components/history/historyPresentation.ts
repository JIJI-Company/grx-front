import type {
  HistoryAchievement,
  MembersGrouped,
  NoticeStreamer,
} from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';

// ── 메달 상수 ──
export const MEDAL_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2 };
export const MEDAL_LABEL: Record<string, string> = {
  gold: 'GOLD',
  silver: 'SILVER',
  bronze: 'BRONZE',
};
export const MEDAL_ICON: Record<string, string> = {
  gold: '/img/icons/gold.png',
  silver: '/img/icons/silver.png',
  bronze: '/img/icons/bronze.png',
};

// ── 카테고리 표시 메타 (Notion category 이름 → 이모지/라벨) ──
interface CategoryMeta {
  emoji: string;
  label: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  롤: { emoji: '⚔️', label: 'LOL' },
  배그: { emoji: '🪖', label: '배그' },
  마인크래프트: { emoji: '⛏️', label: 'MINECRAFT' },
  오버워치: { emoji: '🛡️', label: 'OVERWATCH' },
  발로란트: { emoji: '🎯', label: 'VALORANT' },
  멀티: { emoji: '🎮', label: 'MULTI' },
  피파: { emoji: '⚽', label: 'FIFA' },
  기타: { emoji: '✨', label: 'ETC' },
};

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? { emoji: '🎮', label: category.toUpperCase() };
}

// 탭 노출 순서 (데이터에 존재하는 카테고리만 사용)
const CATEGORY_ORDER = ['롤', '배그', '마인크래프트', '오버워치', '발로란트', '피파', '멀티', '기타'];

export function categoriesInData(items: HistoryAchievement[]): string[] {
  const present = Array.from(new Set(items.map((a) => a.category).filter(Boolean)));
  return present.sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

// ── 정렬 / 집계 ──
export function sortByMedal(items: HistoryAchievement[]): HistoryAchievement[] {
  return [...items].sort((a, b) => (MEDAL_ORDER[a.medal] ?? 99) - (MEDAL_ORDER[b.medal] ?? 99));
}

export interface MedalCounts {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export function countMedals(items: HistoryAchievement[]): MedalCounts {
  const counts: MedalCounts = { gold: 0, silver: 0, bronze: 0, total: items.length };
  items.forEach((a) => {
    if (a.medal === 'gold' || a.medal === 'silver' || a.medal === 'bronze') counts[a.medal]++;
  });
  return counts;
}

// ISO("2025-10-26") → "2025.10"
export function formatDate(iso: string): string {
  if (!iso) return '';
  const [year, month] = iso.split('-');
  return month ? `${year}.${Number(month)}` : year;
}

export interface HistoryMemberProfile {
  name: string;
  personalColor: string;
  labelTextColor: string;
  avatar: string;
}

export type HistoryMemberProfileMap = Record<string, HistoryMemberProfile>;

export function buildHistoryMemberProfileMap(
  groupedMembers: MembersGrouped | undefined,
  streamers: NoticeStreamer[],
): HistoryMemberProfileMap {
  if (!groupedMembers) return {};

  const members = [
    ...groupedMembers.master,
    ...groupedMembers.upper,
    ...groupedMembers.lower,
    ...groupedMembers.new,
    ...(groupedMembers.other ?? []),
  ];
  const streamerByName = new Map(
    streamers.map((streamer) => [streamer.name.trim(), streamer]),
  );

  return Object.fromEntries(
    members.flatMap((member) => {
      const name = member.stageName.trim();
      const streamer = streamerByName.get(name);
      if (!streamer?.avatar) return [];
      const personalColor = getMemberColor(member);

      return [
        [
          name,
          {
            name,
            personalColor,
            labelTextColor: getLabelTextColor(personalColor),
            avatar: streamer.avatar,
          },
        ],
      ];
    }),
  );
}

export function getAchievementMemberProfiles(
  memberNames: string[],
  profileMap: HistoryMemberProfileMap,
): HistoryMemberProfile[] {
  return memberNames.flatMap((name) => {
    const profile = profileMap[name.trim()];
    return profile ? [profile] : [];
  });
}

function getLabelTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(hex)) return '#ffffff';

  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 150 ? '#08080a' : '#ffffff';
}
