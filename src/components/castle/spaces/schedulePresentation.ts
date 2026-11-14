// 광장 게시판의 "이번 주 일정" 표현 로직 (순수 함수).
// - 하루는 새벽 5시에 바뀐다(방송 기준): 새벽 1시라면 아직 "어제". 오늘부터 7일을 보여 준다.
// - 휴방(태그 '휴방' 또는 제목에 '휴방')은 뺀다.
// - 하루에 일정이 여러 개면 모두, 여러 날 일정(endDate)은 걸친 날마다 넣는다.
// - 일정이 없는 날도 7일 모두 돌려준다(화면에서 "일정 없음"). 휴방만 있는 날도 일정 없음.
// - 날짜만 있는 일정은 Notion 날짜 그대로(UTC 자정으로 온다), 시각이 있는 일정은 현지 시각으로 날짜·시각을 정한다.
import type { CalendarEvent } from '../../../api/types';

export interface BoardEvent {
  id: string;
  title: string;
  /** 출연 멤버 (없으면 빈 문자열) */
  who: string;
  /** 시각이 있는 일정만 "15:00" */
  time: string | null;
}

export interface BoardDay {
  /** YYYY-MM-DD */
  date: string;
  /** "11/14 (금)" */
  label: string;
  /** 오늘(새벽 5시 기준)인가 */
  isToday: boolean;
  events: BoardEvent[];
}

/** 하루가 바뀌는 시각 */
export const DAY_START_HOUR = 5;
const DAYS = 7;
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** YYYY-MM-DD에 n일 더하기 */
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return ymd(new Date(y, m - 1, d + n));
}

export function isDayOff(e: CalendarEvent): boolean {
  return e.tags.includes('휴방') || e.title.includes('휴방');
}

/** 일정의 시작·끝 날짜(방송 기준)와 시각 */
function spanOf(e: CalendarEvent): { start: string; end: string; time: string | null } {
  const allDay = e.date.endsWith('T00:00:00.000Z') || e.date.length === 10;
  if (allDay) {
    const start = e.date.slice(0, 10);
    const end = e.endDate ? e.endDate.slice(0, 10) : start;
    return { start, end: end < start ? start : end, time: null };
  }
  const at = new Date(e.date);
  const start = ymd(new Date(at.getTime() - DAY_START_HOUR * 3600_000)); // 새벽 2시 방송은 전날 일정
  return { start, end: start, time: `${pad(at.getHours())}:${pad(at.getMinutes())}` };
}

export function thisWeekSchedule(events: CalendarEvent[], now = new Date()): BoardDay[] {
  const today = ymd(new Date(now.getTime() - DAY_START_HOUR * 3600_000));
  const last = addDays(today, DAYS - 1);
  const byDay = new Map<string, BoardEvent[]>();
  for (const e of events) {
    if (!e.date || isDayOff(e)) continue;
    const { start, end, time } = spanOf(e);
    for (let day = start < today ? today : start; day <= end && day <= last; day = addDays(day, 1)) {
      byDay.set(day, [...(byDay.get(day) ?? []), { id: `${e.id}:${day}`, title: e.title.trim(), who: e.members.join(' · '), time }]);
    }
  }
  return Array.from({ length: DAYS }, (_, i) => addDays(today, i))
    .map((date) => {
      const list = byDay.get(date) ?? [];
      const [y, m, d] = date.split('-').map(Number);
      return {
        date,
        label: `${m}/${d} (${WEEKDAY[new Date(y, m - 1, d).getDay()]})`,
        isToday: date === today,
        // 시각 있는 일정이 먼저(시각순), 그다음 제목순
        events: list.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99') || a.title.localeCompare(b.title, 'ko')),
      };
    });
}
