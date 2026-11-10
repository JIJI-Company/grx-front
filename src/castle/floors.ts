// 층 정의: 걸을 수 있는 영역, 높이, 석상 자리, 층 이동 트리거, 카메라·안개. 층 추가·수정은 여기만 고친다.
// 수치는 PoC에서 검증한 값을 그대로 쓴다.
import type { CastleStatueFloor } from '../api/types';
import { getMemberColor } from '../utils/memberColor';
import type { FloorId } from './protocol';

export type Rect = { x0: number; x1: number; z0: number; z1: number }; // x0<x1, z0<z1

export interface FloorTrigger {
  rect: Rect;
  to: FloorId;
  /** 구역 안 누적 이동 거리(m). 5걸음 ≈ 3m */
  meters: number;
  /** 이동 연출 페이드 색 */
  fade: string;
}

export interface StatueSlot {
  x: number;
  z: number;
  rotY: number;
  scale: number;
  lift: number;
  float: boolean;
}

export interface FloorDef {
  id: FloorId;
  title: string;
  sub: string;
  walk: Rect[];
  spawn: [number, number];
  heightAt: (x: number, z: number) => number;
  /** 같은 계급 n명 중 i번째 석상 자리. 한 층에 계급이 둘이면 rankSlug로 구역을 나눈다 */
  slot: (i: number, n: number, rankSlug: CastleStatueFloor['rankSlug']) => StatueSlot;
  /** 이 층에 세울 최대 석상 수 */
  maxStatues: number;
  triggers: FloorTrigger[];
  /** [높이, 뒤로 거리, 바라볼 높이] */
  camera: [number, number, number];
  fog: string;
  fogDensity: number;
}

export interface PlacedStatue extends StatueSlot {
  memberId: string;
  name: string;
  rankName: string;
  color: string;
}

export const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

const STEPS_5 = 3;
const spread = (n: number, span: number, max: number) => (n > 1 ? Math.min(max, span / (n - 1)) : 0);

// ── B1: 하현의 회랑 → 복도 끝 발코니 → 계단 5칸
const B1_STAIRS: Rect = { x0: -1.6, x1: 1.6, z0: -53, z1: -48 };
const B1: FloorDef = {
  id: 'B1',
  title: '지하 1층',
  sub: '하현의 회랑',
  walk: [
    { x0: -1.9, x1: 1.9, z0: -40, z1: 2 }, // 복도
    { x0: -6, x1: 6, z0: -48, z1: -40 }, // 발코니
    B1_STAIRS,
  ],
  spawn: [0, 0],
  heightAt: (_x, z) => (z < -48 ? -Math.min((-48 - z) / 5, 1) * 2 : 0),
  // 난간 뒤 양옆에 번갈아. 신입은 입구 쪽(z -0.5 ~ -10)에 작게, 하현은 그 안쪽 복도(z -13 ~ -37)
  slot: (i, n, rankSlug) => {
    const left = i % 2 === 0;
    const rotY = left ? Math.PI / 2 : -Math.PI / 2;
    if (rankSlug === 'new') return { x: left ? -4.6 : 4.6, z: -0.5 - i * spread(n, 9.6, 2.4), rotY, scale: 1, lift: 0, float: false };
    return { x: left ? -4 : 4, z: -13 - i * spread(n, 24, 6), rotY, scale: 1.2, lift: 0, float: false };
  },
  maxStatues: Infinity,
  triggers: [{ rect: B1_STAIRS, to: 'B2', meters: STEPS_5, fade: '#000000' }],
  camera: [3.2, 6.5, 1.4], // 천장 보(5.8m) 아래에 카메라를 둔다
  fog: '#0d0503',
  fogDensity: 0.022,
};

// ── B2: 상현의 방 → 가운데 통로 끝 해치
const B2_HATCH: Rect = { x0: -1.6, x1: 1.6, z0: -36, z1: -30 };
const B2: FloorDef = {
  id: 'B2',
  title: '지하 2층',
  sub: '상현의 방',
  walk: [{ x0: -18, x1: 18, z0: -38, z1: 4 }],
  spawn: [0, 2],
  heightAt: () => 0,
  slot: (i, n) => {
    const left = i % 2 === 0;
    return { x: left ? -9 : 9, z: -8 - i * spread(n, 16, 8), rotY: left ? Math.PI / 2 : -Math.PI / 2, scale: 1.8, lift: 0, float: false };
  },
  maxStatues: Infinity,
  triggers: [{ rect: B2_HATCH, to: 'B3', meters: STEPS_5, fade: '#3a0306' }],
  camera: [9, 12, 1],
  fog: '#140a02',
  fogDensity: 0.012,
};

// ── B3: 심층. 떠 있는 단 + 다리. 다리 끝 계단으로 B1 입구 복귀
const B3_EXIT: Rect = { x0: -1.4, x1: 1.4, z0: 13, z1: 18 };
const B3: FloorDef = {
  id: 'B3',
  title: '지하 3층',
  sub: '심층',
  walk: [
    { x0: -7, x1: 7, z0: -2.5, z1: 6 }, // 단 (석상 앞까지만)
    { x0: -1.4, x1: 1.4, z0: 6, z1: 18 }, // 다리
  ],
  spawn: [0, 4],
  heightAt: () => 0,
  slot: () => ({ x: 0, z: -7, rotY: 0, scale: 4.4, lift: 2.2, float: true }),
  maxStatues: 1,
  triggers: [{ rect: B3_EXIT, to: 'B1', meters: STEPS_5, fade: '#000000' }],
  camera: [6, 22, 7],
  fog: '#120203',
  fogDensity: 0.011,
};

export const FLOORS: Record<FloorId, FloorDef> = { B1, B2, B3 };
export const FIRST_FLOOR: FloorId = 'B1';

export function isWalkable(f: FloorDef, x: number, z: number): boolean {
  return f.walk.some((r) => inRect(r, x, z));
}

// 석상 이름표의 계급 표기. DB 계급 이름(예: 'New')보다 우선한다
const RANK_LABEL: Partial<Record<CastleStatueFloor['rankSlug'], string>> = {
  new: '신입',
  'lower-rank': '하현',
  'upper-rank': '상현',
};

/** 서버 석상 배치표(층·계급·order) → 이 층 석상의 좌표. 좌표는 프론트가 정한다 (api.md §5) */
export function placeStatues(floor: FloorDef, floors: CastleStatueFloor[]): PlacedStatue[] {
  return floors
    .filter((f) => f.floor === floor.id)
    .flatMap((entry) => {
      const statues = [...entry.statues].sort((a, b) => a.order - b.order).slice(0, floor.maxStatues);
      return statues.map((s, i) => ({
        ...floor.slot(i, statues.length, entry.rankSlug),
        memberId: s.memberId,
        name: s.stageName,
        rankName: RANK_LABEL[entry.rankSlug] ?? entry.rankName,
        color: getMemberColor(s),
      }));
    });
}

/** memberId가 서 있는 층과 이름 (각성 알림용) */
export function findStatue(floors: CastleStatueFloor[], memberId: string): { floor: FloorDef; name: string } | null {
  for (const f of floors) {
    const s = f.statues.find((st) => st.memberId === memberId);
    if (s) return { floor: FLOORS[f.floor], name: s.stageName };
  }
  return null;
}
