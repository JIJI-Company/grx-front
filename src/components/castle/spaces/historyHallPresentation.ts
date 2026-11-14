// History 전당에 놓을 기록의 표현 로직 (순수 함수). 화면은 받은 결과를 그리기만 한다.
import type { HistoryAchievement } from '../../../api/types';
import type { Medal } from './parts';

/** 전당에 놓는 기록 하나 */
export interface HallRecord {
  id: string;
  title: string;
  category: string;
  medal: Medal;
  /** 수상 사진 주소. 없으면 빈 액자 */
  image: string | null;
  /** ISO 날짜 */
  date: string;
  /** 참가 멤버 이름 */
  members: string[];
}

export interface CategoryBayData {
  category: string;
  records: HallRecord[];
}

/** API 응답 → 전당 기록. 메달이 없는 기록은 놓지 않는다 */
export function toHallRecords(items: HistoryAchievement[]): HallRecord[] {
  return items.flatMap((a) => (a.medal ? [{ id: a.id, title: a.title, category: a.category, medal: a.medal, image: a.image, date: a.date, members: a.members }] : []));
}

const MEDAL_RANK: Record<Medal, number> = { gold: 0, silver: 1, bronze: 2 };

/** 종목별로 묶는다. 기록이 많은 종목이 입구 쪽, 종목 안에서는 금 → 은 → 동 */
export function groupByCategory(records: HallRecord[]): CategoryBayData[] {
  const map = new Map<string, HallRecord[]>();
  for (const r of records) map.set(r.category, [...(map.get(r.category) ?? []), r]);
  return [...map.entries()]
    .map(([category, rs]) => ({ category, records: [...rs].sort((a, b) => MEDAL_RANK[a.medal] - MEDAL_RANK[b.medal]) }))
    .sort((a, b) => b.records.length - a.records.length || a.category.localeCompare(b.category, 'ko'));
}

export function medalTotals(records: HallRecord[]): Record<Medal, number> {
  const t: Record<Medal, number> = { gold: 0, silver: 0, bronze: 0 };
  for (const r of records) t[r.medal]++;
  return t;
}

export interface ExhibitSpot {
  id: string;
  x: number;
  z: number;
}

/** 전시대 사이 간격과 종목 사이 간격(m) */
export const EXHIBIT_SPACING = 1.7;
const BAY_GAP = 2.4;

export interface BayPlacement extends CategoryBayData {
  /** 통로의 왼쪽(-1)·오른쪽(1) */
  side: -1 | 1;
  /** 이 종목 줄의 가운데 z */
  z: number;
}

/** 종목을 통로 양옆에 차례로 놓는다: 기록마다 전시대 하나라 종목 길이가 다르므로, 덜 찬 쪽에 다음 종목을 둔다. startZ에서 -z로 뻗는다 */
export function placeBays(bays: CategoryBayData[], startZ: number): { placed: BayPlacement[]; endZ: number } {
  const cursor: Record<-1 | 1, number> = { [-1]: startZ, 1: startZ };
  const placed = bays.map((bay): BayPlacement => {
    const side = cursor[-1] >= cursor[1] ? -1 : 1;
    const length = bay.records.length * EXHIBIT_SPACING;
    const z = cursor[side] - length / 2;
    cursor[side] -= length + BAY_GAP;
    return { ...bay, side, z };
  });
  return { placed, endZ: Math.min(cursor[-1], cursor[1]) };
}

/** 전시대의 바닥 좌표 (가까이 갔는지 판정용). 종목 줄은 통로와 나란히 z로 뻗는다: 왼쪽 줄은 i가 커질수록 -z, 오른쪽 줄은 +z */
export function exhibitSpots(placed: BayPlacement[], rowX: number): ExhibitSpot[] {
  return placed.flatMap((bay) =>
    bay.records.map((r, i) => ({ id: r.id, x: bay.side * rowX, z: bay.z + bay.side * (i - (bay.records.length - 1) / 2) * EXHIBIT_SPACING })),
  );
}

/** (x, z)에서 radius 안에 있는 가장 가까운 전시대 */
export function nearestExhibit(spots: ExhibitSpot[], x: number, z: number, radius: number): string | null {
  let best: string | null = null;
  let bestD = radius;
  for (const s of spots) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < bestD) {
      best = s.id;
      bestD = d;
    }
  }
  return best;
}

/** 첫 전시대가 시작하는 z (입구 쪽) */
export const HALL_FIRST_Z = -1.5;
/** 맨 안쪽 벽의 z: 마지막 전시대에서 4m 더 들어간다(합계 단 자리) */
export function hallEndZ(records: HallRecord[]): number {
  return placeBays(groupByCategory(records), HALL_FIRST_Z).endZ - 4;
}
