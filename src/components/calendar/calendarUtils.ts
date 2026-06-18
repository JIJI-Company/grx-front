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

const memberPalette = [
  { bg: 'rgba(225,29,72,0.25)', text: '#fda4af' },
  { bg: 'rgba(59,130,246,0.25)', text: '#93c5fd' },
  { bg: 'rgba(16,185,129,0.25)', text: '#6ee7b7' },
  { bg: 'rgba(245,158,11,0.25)', text: '#fcd34d' },
  { bg: 'rgba(168,85,247,0.25)', text: '#d8b4fe' },
  { bg: 'rgba(236,72,153,0.25)', text: '#f9a8d4' },
  { bg: 'rgba(14,165,233,0.25)', text: '#7dd3fc' },
  { bg: 'rgba(234,179,8,0.25)', text: '#fde047' },
];
const memberColorCache: Record<string, { bg: string; text: string }> = {};
let memberColorIndex = 0;

export function getMemberColor(name: string) {
  if (!memberColorCache[name]) {
    memberColorCache[name] = memberPalette[memberColorIndex++ % memberPalette.length];
  }

  return memberColorCache[name];
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
