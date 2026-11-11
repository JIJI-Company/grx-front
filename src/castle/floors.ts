// 층 정의: 걸을 수 있는 영역, 높이, 석상 자리, 층 이동 트리거, 카메라·안개. 층 추가·수정은 여기만 고친다.
// 수치는 PoC에서 검증한 값을 그대로 쓴다.
import type { CastleStatueFloor } from '../api/types';
import { getMemberColor } from '../utils/memberColor';
import type { FloorId } from './protocol';
import type { TransitionKind } from './transition';

export type Rect = { x0: number; x1: number; z0: number; z1: number }; // x0<x1, z0<z1

/** 걸을 수 없는 곳. 반지름·사각형은 몸 두께(PLAYER_RADIUS)를 이미 더한 값이다 */
export type Blocker = ({ kind: 'box' } & Rect) | { kind: 'circle'; x: number; z: number; r: number };

/** 충돌 판정에 필요한 것만: 걷기 영역 + 막힌 곳 (층 정의 + 석상) */
export interface WalkArea {
  walk: Rect[];
  blockers: Blocker[];
}

/** 캐릭터 몸 반지름(m). 막힌 곳에 더해서 쓴다 */
export const PLAYER_RADIUS = 0.3;

export interface FloorTrigger {
  rect: Rect;
  to: FloorId;
  /** 층 이동 연출 종류 (castle/transition.ts) */
  effect: TransitionKind;
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

/** 톤 매핑 뒤 색 보정(선형 색공간): c = mix(luma, c, saturation) * gain + lift * (1 - c) */
export interface FloorGrade {
  lift: [number, number, number];
  gain: [number, number, number];
  saturation: number;
}

export interface FloorDef extends WalkArea {
  id: FloorId;
  title: string;
  sub: string;
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
  grade: FloorGrade;
}

export interface PlacedStatue extends StatueSlot {
  memberId: string;
  name: string;
  rankName: string;
  color: string;
}

export const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

const STEPS_5 = 3;
const R = PLAYER_RADIUS;
const circle = (x: number, z: number, r: number): Blocker => ({ kind: 'circle', x, z, r: r + R });
const box = (x0: number, x1: number, z0: number, z1: number): Blocker => ({ kind: 'box', x0: x0 - R, x1: x1 + R, z0: z0 - R, z1: z1 + R });
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
  // 발코니 끝 난간 (계단 입구만 열려 있다)
  blockers: [box(-6, -1.8, -48, -47.85), box(1.8, 6, -48, -47.85)],
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
  triggers: [{ rect: B1_STAIRS, to: 'B2', meters: STEPS_5, fade: '#000000', effect: 'stairs' }],
  camera: [3.2, 6.5, 1.4], // 천장 보(5.8m) 아래에 카메라를 둔다
  fog: '#0d0503',
  fogDensity: 0.022,
  grade: { lift: [0.006, 0.002, 0], gain: [1.08, 0.96, 0.8], saturation: 1.05 }, // 따뜻한 주황
};

// ── B2: 상현의 방 → 가운데 통로 끝 해치. 장식 자리는 장면(SceneB2)과 충돌이 같은 수치를 쓴다
export const B2_HATCH: Rect = { x0: -1.6, x1: 1.6, z0: -36, z1: -30 };
/** 기둥 숲: 통로 옆 2줄 + 바깥 2줄(걷기 영역 밖은 장식만) */
export const B2_PILLARS: [number, number][] = [
  ...[-4, -12, -20, -28].flatMap((z) => [[-5.6, z], [5.6, z]] as [number, number][]),
  ...[2, -6, -14, -22, -30].flatMap((z) => [[-13, z], [13, z], [-20.5, z - 4], [20.5, z - 4]] as [number, number][]),
];
export const B2_PILLAR_RADIUS = 0.4;
/** 통로 양옆 석등 길 */
export const B2_LANTERN_PATH: [number, number][] = Array.from({ length: 8 }, (_, i) => -i * 4).flatMap((z) => [
  [-2.4, z],
  [2.4, z],
]);
/** 병풍: 중심, 바라보는 방향, 폭(m). 양옆 벽 3쌍 + 안쪽 높은 단 위 1개 */
export const B2_SCREENS: { x: number; z: number; rotY: number; width: number; y: number }[] = [
  ...[-4, -16, -28].flatMap((z) => [
    { x: -16.8, z, rotY: Math.PI / 2, width: 6, y: 0 },
    { x: 16.8, z, rotY: -Math.PI / 2, width: 6, y: 0 },
  ]),
  { x: 0, z: -43, rotY: 0, width: 11, y: 1.2 },
];
/** 해치 뒤 높은 단 (걷기 영역 밖) */
export const B2_DAIS = { z0: -46, z1: -39, halfW: 8, height: 1.2 };
const B2: FloorDef = {
  id: 'B2',
  title: '지하 2층',
  sub: '상현의 방',
  walk: [{ x0: -18, x1: 18, z0: -38, z1: 4 }],
  blockers: [
    ...B2_PILLARS.map(([x, z]) => circle(x, z, B2_PILLAR_RADIUS)),
    ...B2_LANTERN_PATH.map(([x, z]) => circle(x, z, 0.28)),
    ...B2_SCREENS.filter((s) => s.y === 0).map((s) => box(s.x - 0.35, s.x + 0.35, s.z - s.width / 2, s.z + s.width / 2)),
    // 해치 테두리: 옆과 뒤는 막고 앞(+z)으로만 들어간다
    box(-1.9, -1.6, -36.3, -30),
    box(1.6, 1.9, -36.3, -30),
    box(-1.9, 1.9, -36.3, -36),
  ],
  spawn: [0, 2],
  heightAt: () => 0,
  // 통로를 사이에 두고 마주 보게 짝지어 방 가운데에 둔다 (상현 2기면 z -16에 한 쌍)
  slot: (i, n) => {
    const left = i % 2 === 0;
    const pairs = Math.ceil(n / 2);
    const z = -16 - (Math.floor(i / 2) - (pairs - 1) / 2) * spread(pairs, 20, 9);
    return { x: left ? -8.5 : 8.5, z, rotY: left ? Math.PI / 2 : -Math.PI / 2, scale: 2, lift: 0, float: false };
  },
  maxStatues: Infinity,
  triggers: [{ rect: B2_HATCH, to: 'B3', meters: STEPS_5, fade: '#3a0306', effect: 'hatch' }],
  camera: [9, 12, 1],
  fog: '#140a02',
  fogDensity: 0.012,
  grade: { lift: [0.005, 0.004, 0], gain: [1.02, 0.94, 0.7], saturation: 0.8 }, // 탁한 금색
};

// ── B3: 심층. 떠 있는 단 + 다리. 다리 끝 계단으로 B1 입구 복귀
const B3_EXIT: Rect = { x0: -1.4, x1: 1.4, z0: 13, z1: 18 };
/** 단 둘레 검사 전시(B3Exhibit)의 배율. 바꾸면 아래 B3 blockers(쓰러진 검사 2기)도 다시 맞춘다 */
export const B3_EXHIBIT_GROW = 1.45;
const B3: FloorDef = {
  id: 'B3',
  title: '지하 3층',
  sub: '심층',
  walk: [
    { x0: -7, x1: 7, z0: -2.5, z1: 6 }, // 단 (석상 앞까지만)
    { x0: -1.4, x1: 1.4, z0: 6, z1: 18 }, // 다리
  ],
  // 걷기 영역에 걸치는 쓰러진 검사 2기 (B3_EXHIBIT_GROW 배율 기준 머리·팔 범위)
  blockers: [box(-7.4, -6.7, -1.9, -0.15), box(5.55, 7, 1.2, 2.55)],
  spawn: [0, 4],
  heightAt: () => 0,
  slot: () => ({ x: 0, z: -7, rotY: 0, scale: 4.4, lift: 2.2, float: true }),
  maxStatues: 1,
  triggers: [{ rect: B3_EXIT, to: 'B1', meters: STEPS_5, fade: '#000000', effect: 'return' }],
  camera: [6, 22, 7],
  fog: '#120203',
  fogDensity: 0.011,
  grade: { lift: [0.002, 0, 0.006], gain: [1.06, 0.84, 0.9], saturation: 0.92 }, // 차가운 붉은색
};

export const FLOORS: Record<FloorId, FloorDef> = { B1, B2, B3 };
export const FIRST_FLOOR: FloorId = 'B1';

function blocks(b: Blocker, x: number, z: number): boolean {
  return b.kind === 'circle' ? Math.hypot(x - b.x, z - b.z) < b.r : inRect(b, x, z);
}

/** 걷기 영역 안이고 막힌 곳이 아니면 걸을 수 있다 */
export function isWalkable(a: WalkArea, x: number, z: number): boolean {
  return a.walk.some((r) => inRect(r, x, z)) && !a.blockers.some((b) => blocks(b, x, z));
}

/** 석상 받침대(1.5 x 1.5, scale배) 반지름. 떠 있는 석상은 막지 않는다 */
export function statueRadius(s: StatueSlot): number {
  return 0.8 * s.scale;
}

/** 층 정의 + 이 층 석상 → 충돌 영역 */
export function walkAreaOf(floor: FloorDef, statues: PlacedStatue[]): WalkArea {
  const fixed = statues.filter((s) => !s.float).map((s) => circle(s.x, s.z, statueRadius(s)));
  return { walk: floor.walk, blockers: [...floor.blockers, ...fixed] };
}

// 석상 이름표의 계급 표기. DB 계급 이름(예: 'New')보다 우선한다
const RANK_LABEL: Partial<Record<CastleStatueFloor['rankSlug'], string>> = {
  new: '신입',
  'lower-rank': '하현',
  'upper-rank': '상현',
};

/** 상현·하현은 계급 안 순서를 번호로 붙인다 (예: 상현 1). 신입·master는 번호 없음 */
const isNumbered = (slug: CastleStatueFloor['rankSlug']) => slug === 'upper-rank' || slug === 'lower-rank';

function rankLabel(entry: CastleStatueFloor, order: number): string {
  const label = RANK_LABEL[entry.rankSlug] ?? entry.rankName;
  return isNumbered(entry.rankSlug) ? `${label} ${order + 1}` : label;
}

/** 서버 석상 배치표(층·계급·order) → 이 층 석상의 좌표. 좌표는 프론트가 정한다 (api.md §5) */
export function placeStatues(floor: FloorDef, floors: CastleStatueFloor[]): PlacedStatue[] {
  return floors
    .filter((f) => f.floor === floor.id)
    .flatMap((entry) => {
      const statues = [...entry.statues].sort((a, b) => a.order - b.order).slice(0, floor.maxStatues);
      return statues.map((s, i) => ({
        // 번호 계급은 안쪽으로 갈수록 강하다: 입구 쪽이 끝 번호, 가장 안쪽이 1
        ...floor.slot(isNumbered(entry.rankSlug) ? statues.length - 1 - i : i, statues.length, entry.rankSlug),
        memberId: s.memberId,
        name: s.stageName,
        rankName: rankLabel(entry, s.order),
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
