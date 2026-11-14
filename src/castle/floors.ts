// 층 정의: 걸을 수 있는 영역, 높이, 석상 자리, 층 이동 트리거, 카메라·안개. 층 추가·수정은 여기만 고친다.
// 수치는 PoC에서 검증한 값을 그대로 쓴다.
import type { CastleStatueFloor } from '../api/types';
import { getMemberColor } from '../utils/memberColor';
import type { CameraBox } from './orbit';
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
  /** 도착 위치(m). 없으면 목적지의 spawn (예: 전당에서 나오면 광장의 전당 문 앞) */
  arrive?: [number, number];
}

/** 가까이 가면 화면 아래에 뜨는 안내 (닫힌 문 등) */
export interface FloorSign {
  rect: Rect;
  text: string;
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
  /** HUD 층 버튼 글자 (B1·광장 등) */
  tag: string;
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
  /** 카메라가 돌 때 넘지 않을 범위(벽·천장 안쪽). 없으면 제한 없음(트인 공간) */
  cameraBox?: CameraBox;
  /** 가까이 가면 뜨는 안내 */
  signs?: FloorSign[];
  fog: string;
  fogDensity: number;
  grade: FloorGrade;
}

export interface PlacedStatue extends StatueSlot {
  memberId: string;
  name: string;
  rankName: string;
  color: string;
  /** 석상 3D 모델(GLB). null이면 임시 도형 */
  modelUrl: string | null;
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
  tag: 'B1',
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
  cameraBox: { x0: -5.7, x1: 5.7, z0: -60, z1: 9, y1: 5.5 }, // 장지문 벽(x ±6.04) · 천장 보 안쪽
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
  tag: 'B2',
  title: '지하 2층',
  sub: '상현의 방',
  walk: [{ x0: -18, x1: 18, z0: -38, z1: 4 }],
  blockers: [
    ...B2_PILLARS.map(([x, z]) => circle(x, z, B2_PILLAR_RADIUS)),
    // 석등 지붕(반지름 0.46)이 눈높이(1.2~1.55m)에 있어, 붙어 서면 1인칭 화면이 지붕으로 하얗게 덮인다 → 지붕에서 한 걸음 떨어지게 막는다
    ...B2_LANTERN_PATH.map(([x, z]) => circle(x, z, 0.9)),
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
  cameraBox: { x0: -19, x1: 19, z0: -48, z1: 14, y1: 14 }, // 병풍 벽(x ±16.8) 바깥 상자 방 안쪽
  fog: '#140a02',
  fogDensity: 0.012,
  grade: { lift: [0.005, 0.004, 0], gain: [1.02, 0.94, 0.7], saturation: 0.8 }, // 탁한 금색
};

// ── B3: 심층. 떠 있는 단 + 다리. 다리 끝 계단으로 B1 입구 복귀
const B3_EXIT: Rect = { x0: -1.4, x1: 1.4, z0: 29, z1: 34 };
/** 단 둘레 검사 전시(B3Exhibit)의 배율. 바꾸면 아래 B3 blockers(쓰러진 검사 2기)도 다시 맞춘다 */
export const B3_EXHIBIT_GROW = 1.45;
const B3: FloorDef = {
  id: 'B3',
  tag: 'B3',
  title: '지하 3층',
  sub: '심층',
  walk: [
    { x0: -7, x1: 7, z0: -2.5, z1: 6 }, // 단 (석상 앞까지만)
    { x0: -1.4, x1: 1.4, z0: 6, z1: 34 }, // 다리 (끝에 도착해 석상까지 걸어 들어간다. 입장 연출은 castle/reveal.ts)
  ],
  // 걷기 영역에 걸치는 쓰러진 검사 2기 (B3_EXHIBIT_GROW 배율 기준 머리·팔 범위)
  blockers: [box(-7.4, -6.7, -1.9, -0.15), box(5.55, 7, 1.2, 2.55)],
  spawn: [0, 27],
  heightAt: () => 0,
  slot: () => ({ x: 0, z: -7, rotY: 0, scale: 4.4, lift: 2.2, float: true }),
  maxStatues: 1,
  triggers: [{ rect: B3_EXIT, to: 'PLAZA', meters: STEPS_5, fade: '#000000', effect: 'shift' }],
  camera: [6, 22, 7],
  fog: '#120203',
  fogDensity: 0.011,
  grade: { lift: [0.002, 0, 0.006], gain: [1.06, 0.84, 0.9], saturation: 0.92 }, // 차가운 붉은색
};

// ── 광장: 입장하면 도착하는 돌마당(34 x 34m). 남쪽 무한성 문 계단 → B1, 북쪽 전당 문 → History 전당.
// 화랑·관람실·화실 문은 아직 닫혀 있다(안내만). 장면은 components/castle/spaces/PlazaScene.tsx가 같은 수치를 쓴다
export const PLAZA_HALF = 17;
/** 마당 가장자리 돌등 12개 */
export const PLAZA_LAMPS: [number, number][] = [-1, 1].flatMap((s) =>
  [-11, 0, 11].flatMap((t): [number, number][] => [
    [s * (PLAZA_HALF - 1), t],
    [t === 0 ? 7 * s : t, s * (PLAZA_HALF - 1)],
  ]),
);
/** 이번 주 일정 게시판: 가운데 (x, z)와 돌린 각도 */
export const PLAZA_BOARD = { x: 9.5, z: 6.5, rotY: -0.7 };
/** 무한성 문: 문틀 가운데 x (z는 마당 남쪽 끝) */
export const PLAZA_GATE_X = 4;
// 마당 걷기 영역(z ≤ 16.5)과 겹치게 시작해야 이어서 걸어 내려간다
const PLAZA_GATE_STAIRS: Rect = { x0: PLAZA_GATE_X - 1.8, x1: PLAZA_GATE_X + 1.8, z0: 16.3, z1: 20 };
/** 광장 가운데: 바닥 꾸한성 마크 위. 전당에서 나오면 여기 */
export const PLAZA_CENTER: [number, number] = [0, 0];
/** 화랑 문 앞 (서쪽 회랑 계단 아래) */
const PLAZA_GALLERY_DOOR: Rect = { x0: -16.5, x1: -15.3, z0: -3, z1: 1 };
/** 전당 문 앞 (북쪽 계단 아래) */
const PLAZA_HALL_DOOR: Rect = { x0: -2, x1: 2, z0: -16.5, z1: -15.3 };
const boardPosts = [-2, 0, 2].map((t): [number, number] => [
  PLAZA_BOARD.x + t * Math.cos(PLAZA_BOARD.rotY),
  PLAZA_BOARD.z - t * Math.sin(PLAZA_BOARD.rotY),
]);
const PLAZA: FloorDef = {
  id: 'PLAZA',
  tag: '광장',
  title: '꾸한성',
  sub: '광장',
  walk: [{ x0: -16.5, x1: 16.5, z0: -16.5, z1: 16.5 }, PLAZA_GATE_STAIRS],
  blockers: [
    ...PLAZA_LAMPS.map(([x, z]) => circle(x, z, 0.3)),
    ...boardPosts.map(([x, z]) => circle(x, z, 0.5)),
    // 무한성 문 기둥, 전당 계단 양옆 트로피 받침
    circle(PLAZA_GATE_X - 2.4, PLAZA_HALF, 0.34),
    circle(PLAZA_GATE_X + 2.4, PLAZA_HALF, 0.34),
    box(-8.55, -7.05, -17.15, -15.65),
    box(7.05, 8.55, -17.15, -15.65),
  ],
  spawn: [-3, 10], // 무한성 문(x 4) 옆: 카메라가 문틀에 가리지 않는다
  // 무한성 문 계단은 남쪽으로 내려간다
  heightAt: (x, z) => (z > 17.2 && Math.abs(x - PLAZA_GATE_X) < 2.1 ? -(z - 17.2) * 0.5 : 0),
  slot: () => ({ x: 0, z: 0, rotY: 0, scale: 1, lift: 0, float: false }),
  maxStatues: 0,
  triggers: [
    { rect: PLAZA_GATE_STAIRS, to: 'B1', meters: 2.4, fade: '#000000', effect: 'stairs' },
    { rect: PLAZA_HALL_DOOR, to: 'HISTORY', meters: 1, fade: '#000000', effect: 'door' },
    { rect: PLAZA_GALLERY_DOOR, to: 'CONTENT', meters: 1, fade: '#000000', effect: 'door' },
  ],
  signs: [
    { rect: { x0: 14, x1: 16.5, z0: -3.5, z1: 1.5 }, text: '관람실 — 준비 중' },
    { rect: { x0: -12.5, x1: -8.5, z0: 14.5, z1: 16.5 }, text: '화실 — 준비 중' },
  ],
  camera: [6.5, 11, 2],
  // 카메라가 남쪽 무한성 문틀(z 17) 너머로 나가면 문 현판 뒷면이 화면을 가린다 → 문 앞에서 멈춘다
  cameraBox: { x0: -40, x1: 40, z0: -40, z1: 16, y1: 30 },
  fog: '#140c18',
  fogDensity: 0.0045,
  grade: { lift: [0.002, 0.001, 0.004], gain: [1.02, 0.97, 0.98], saturation: 1 },
};

// ── History 전당: 기록 수만큼 안쪽(-z)으로 길어진다. 실제 끝은 historyFloor(endZ)로 정한다(장면이 기록으로 계산).
// 기둥 줄(x ±4.6) 안쪽 통로만 걷는다. 입구(z 6.8~7.6)로 나가면 광장 가운데(꾸한성 마크 위)
const HISTORY_EXIT: Rect = { x0: -2, x1: 2, z0: 6.8, z1: 7.6 };
const HISTORY: FloorDef = {
  id: 'HISTORY',
  tag: '전당',
  title: 'History',
  sub: '영광의 전당',
  walk: [{ x0: -3.8, x1: 3.8, z0: -30, z1: 7.6 }],
  blockers: [],
  spawn: [0, 6],
  heightAt: () => 0,
  slot: () => ({ x: 0, z: 0, rotY: 0, scale: 1, lift: 0, float: false }),
  maxStatues: 0,
  triggers: [{ rect: HISTORY_EXIT, to: 'PLAZA', meters: 0.6, fade: '#000000', effect: 'door', arrive: PLAZA_CENTER }],
  signs: [{ rect: { x0: -2.5, x1: 2.5, z0: 5, z1: 7.6 }, text: '뒤쪽 금빛 표시로 나가면 광장' }],
  camera: [4.2, 7, 2.2],
  cameraBox: { x0: -10.5, x1: 10.5, z0: -130, z1: 12, y1: 8.4 },
  fog: '#120807',
  fogDensity: 0.012,
  grade: { lift: [0.004, 0.002, 0], gain: [1.04, 0.98, 0.88], saturation: 1 },
};

/** 전당 걷기 영역의 안쪽 끝을 기록 수로 정해진 길이(endZ = 안쪽 벽)에 맞춘다. 끝의 합계 단(깊이 약 3m) 앞에서 멈춘다 */
export function historyFloor(endZ: number): FloorDef {
  return { ...HISTORY, walk: [{ ...HISTORY.walk[0], z0: endZ + 3 }] };
}

// ── Content 화랑 (PoC): 전시회처럼 한 방향 동선. 가운데 칸막이가 입구까지 이어져 통로 둘이 나뉜다:
// 왼쪽 통로로 들어가(예전 것부터) 안쪽에서 돌아 오른쪽 통로로 나온다. 포스터 수만큼 길어진다 — galleryFloor(endZ)
// 오른쪽 통로 출구로 나가면 광장 가운데
const CONTENT_EXIT: Rect = { x0: 0.9, x1: 4.9, z0: 6.8, z1: 7.6 };
const CONTENT_SPINE_FRONT = 7.6;
const CONTENT: FloorDef = {
  id: 'CONTENT',
  tag: '화랑',
  title: 'Content',
  sub: '화랑',
  walk: [{ x0: -4.9, x1: 4.9, z0: -30, z1: 7.6 }],
  blockers: [],
  spawn: [-2.9, 6], // 왼쪽 통로(입구)
  heightAt: () => 0,
  slot: () => ({ x: 0, z: 0, rotY: 0, scale: 1, lift: 0, float: false }),
  maxStatues: 0,
  triggers: [{ rect: CONTENT_EXIT, to: 'PLAZA', meters: 0.6, fade: '#000000', effect: 'door', arrive: PLAZA_CENTER }],
  signs: [
    { rect: { x0: -5, x1: -0.4, z0: 4.5, z1: 7.6 }, text: '입구 · 안쪽으로 걸으며 예전 콘텐츠부터' },
    { rect: { x0: 0.4, x1: 5, z0: 4.5, z1: 6.8 }, text: '출구 · 금빛 표시를 지나면 광장' },
  ],
  camera: [3.6, 6, 2],
  cameraBox: { x0: -5.3, x1: 5.3, z0: -100, z1: 12, y1: 5.8 },
  fog: '#0e0908',
  fogDensity: 0.014,
  grade: { lift: [0.004, 0.002, 0], gain: [1.03, 0.98, 0.9], saturation: 1 },
};

/** 화랑 걷기 영역: 안쪽 벽(endZ) 앞까지, 가운데 칸막이(spineZ0 ~ 입구)는 막는다 */
export function galleryFloor(endZ: number, spineZ0: number): FloorDef {
  return { ...CONTENT, walk: [{ ...CONTENT.walk[0], z0: endZ + 0.6 }], blockers: [box(-0.42, 0.42, spineZ0, CONTENT_SPINE_FRONT)] };
}

/** HUD 순서(FLOORS의 넣은 순서)이자 "내려가기/올라가기" 판단 순서: 광장·전당이 위, 지하로 갈수록 아래 */
export const FLOOR_ORDER: readonly FloorId[] = ['PLAZA', 'HISTORY', 'CONTENT', 'B1', 'B2', 'B3'];
export const FLOORS: Record<FloorId, FloorDef> = { PLAZA, HISTORY, CONTENT, B1, B2, B3 };
export const FIRST_FLOOR: FloorId = 'PLAZA';

function blocks(b: Blocker, x: number, z: number): boolean {
  return b.kind === 'circle' ? Math.hypot(x - b.x, z - b.z) < b.r : inRect(b, x, z);
}

/** 걷기 영역 안이고 막힌 곳이 아니면 걸을 수 있다 */
export function isWalkable(a: WalkArea, x: number, z: number): boolean {
  return a.walk.some((r) => inRect(r, x, z)) && !a.blockers.some((b) => blocks(b, x, z));
}

/** 석상 받침대(1.5 x 1.5, scale배) 반지름. 떠 있는 석상은 막지 않는다 */
export function statueRadius(s: StatueSlot): number {
  // 발치 등롱이 중심에서 1.3까지 놓인다(LanternRing). 그 안까지 걸어 들어가면 1인칭 카메라가 등롱 안에 묻혀 화면이 하얗게 덮인다
  return 1.45 * s.scale;
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
        modelUrl: s.modelUrl,
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
