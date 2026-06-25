import type { CalendarEvent } from '../../api/types';

export const DAY_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export type ScheduleMap = Record<string, CalendarEvent[]>;

export function toDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getWeekDays(base: Date): Date[] {
  const dayOfWeek = base.getDay();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - dayOfWeek + index);
    return date;
  });
}

export function formatTime(iso: string): string {
  if (!iso.includes('T')) return '종일';

  const date = new Date(iso);
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
}

export function buildScheduleMap(events: CalendarEvent[], memberFilter: string): ScheduleMap {
  const filtered = memberFilter === 'ALL'
    ? events
    : events.filter((event) => event.members.includes(memberFilter));
  const map: ScheduleMap = {};

  for (const event of filtered) {
    if (!event.date) continue;

    const start = event.date.slice(0, 10);
    const end = event.endDate ? event.endDate.slice(0, 10) : start;
    const current = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    while (current <= endDate) {
      const key = toDateString(current);
      (map[key] ??= []).push(event);
      current.setDate(current.getDate() + 1);
    }
  }

  for (const key of Object.keys(map)) {
    map[key].sort(
      (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
    );
  }

  return map;
}

const memberBadgeColors: Record<string, { bg: string; text: string }> = {
  서라0: { bg: '#4FC3F7', text: '#0F172A' },
  임민트: { bg: '#00C9A7', text: '#FFFFFF' },
  김옥독: { bg: '#9CD5C2', text: '#0F172A' },
  냥쏘: { bg: '#FFB6C1', text: '#0F172A' },
  윤타미: { bg: '#87CEEB', text: '#0F172A' },
  봄세이: { bg: '#5DADE2', text: '#FFFFFF' },
  꾸티뉴: { bg: '#F87171', text: '#FFFFFF' },
  야무지: { bg: '#FCA5A5', text: '#7F1D1D' },
  엔쥬: { bg: '#FFFFFF', text: '#0F172A' },
  리카: { bg: '#FDE047', text: '#713F12' },
  난워니: { bg: '#FEF08A', text: '#713F12' },
  다뮤: { bg: '#93C5FD', text: '#1E3A8A' },
  딴딴2당: { bg: '#FBCFE8', text: '#701A75' },
  바먀: { bg: '#D97706', text: '#FFFFFF' },
  란다: { bg: '#FDBA74', text: '#7C2D12' },
  모야: { bg: '#B8C9FF', text: '#1E1B4B' },
  소심해: { bg: '#F472B6', text: '#FFFFFF' },
  컨텐츠: { bg: '#8B5CF6', text: '#FFFFFF' },
  합방: { bg: '#EC4899', text: '#FFFFFF' },
};

const memberAvatarMap: Record<string, string> = {
  꾸티뉴: '/img/ggutinho.png',
  야무지: '/img/yamuzi.png',
  엔쥬: '/img/enju.png',
  리카: '/img/lika.png',
  난워니: '/img/nanana.png',
  다뮤: '/img/damu.jpeg',
  딴딴2당: '/img/ttanttan.jpeg',
  바먀: '/img/baamya.png',
  서라0: '/img/서라0.jpg',
  임민트: '/img/mint.png',
  김옥독: '/img/okdok.png',
  냥쏘: '/img/nangsso.png',
  윤타미: '/img/tami.png',
  봄세이: '/img/BOMSAI.png',
  모야: '/img/moya.png',
  소심해: '/img/sosim.jpeg',
  란다: '/img/randa.jpg',
};

export function getMemberColor(name: string) {
  return memberBadgeColors[name] || { bg: '#444', text: '#aaa' };
}

export function getMemberAvatar(name: string) {
  return memberAvatarMap[name] || `/img/${name}.png`;
}

export function getEventStyle(
  event: CalendarEvent,
): { cardBg: string; titleColor: string; border: string } {
  const isDayOff = event.title.includes('휴방') || event.tags.includes('휴방');
  const isContent = event.tags.some(
    (tag) => tag.includes('콘텐츠') || tag.includes('컨텐츠'),
  ) || event.title.includes('콘텐츠') || event.title.includes('컨텐츠');

  if (isDayOff) {
    return { cardBg: '#2d2200', titleColor: '#fde68a', border: '#f59e0b' };
  }
  if (isContent) {
    return { cardBg: '#012a2e', titleColor: '#a5f3fc', border: '#06b6d4' };
  }
  return { cardBg: '#2d0a1a', titleColor: '#fce7f3', border: '#e11d48' };
}

export interface SlottedEvent {
  startCol: number;
  span: number;
  slotIndex: number;
  event: CalendarEvent;
}

export function getGreedySlots(
  events: CalendarEvent[],
  weekStart: Date,
): SlottedEvent[] {
  const sorted = [...events].sort((left, right) => {
    const leftStart = new Date(left.date.slice(0, 10)).getTime();
    const rightStart = new Date(right.date.slice(0, 10)).getTime();

    if (leftStart !== rightStart) return leftStart - rightStart;

    const leftEnd = left.endDate
      ? new Date(left.endDate.slice(0, 10)).getTime()
      : leftStart;
    const rightEnd = right.endDate
      ? new Date(right.endDate.slice(0, 10)).getTime()
      : rightStart;

    return (rightEnd - rightStart) - (leftEnd - leftStart);
  });
  const weekStartTime = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate(),
  ).getTime();
  const dayInMilliseconds = 86400000;
  const slots: Array<Array<{ start: number; end: number }>> = [];
  const result: SlottedEvent[] = [];

  for (const event of sorted) {
    const eventStart = new Date(`${event.date.slice(0, 10)}T00:00:00`).getTime();
    const eventEnd = event.endDate
      ? new Date(`${event.endDate.slice(0, 10)}T00:00:00`).getTime()
      : eventStart;
    const startCol = Math.max(
      0,
      Math.min(6, Math.round((eventStart - weekStartTime) / dayInMilliseconds)),
    );
    const endCol = Math.max(
      startCol,
      Math.min(6, Math.round((eventEnd - weekStartTime) / dayInMilliseconds)),
    );
    let slotIndex = 0;

    while (true) {
      if (!slots[slotIndex]) slots[slotIndex] = [];
      const overlaps = slots[slotIndex].some(
        (range) => !(endCol < range.start || startCol > range.end),
      );

      if (!overlaps) {
        slots[slotIndex].push({ start: startCol, end: endCol });
        result.push({
          startCol,
          span: endCol - startCol + 1,
          slotIndex,
          event,
        });
        break;
      }

      slotIndex++;
    }
  }

  return result;
}
