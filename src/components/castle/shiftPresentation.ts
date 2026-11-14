// 재배치(shift) 연출의 방 배치·움직임. 좌표는 카메라 기준(x 오른쪽, y 위, 앞이 -z) — 카메라는 제자리이고 방들이 움직인다.
// out: 장지문 방들이 위아래·좌우로 시야를 가로지르며 일부는 90도 접히고, 끝에 가까운 벽이 흐름을 따라 들어와 시야를 덮는다.
// in: 층이 바뀐 뒤 벽이 양옆으로 갈라진다. 위층으로 가면 방이 아래로, 아래층으로 가면 위로 흐른다.
import { transitionPlan, type TransitionPhase, type TransitionRoute } from '../../castle/transition';
import { rng } from './floors/sceneParts';

type Vec3 = [number, number, number];

export interface ShiftRoom {
  /** 멈춰 있을 때 자리(벽) 또는 흐름의 가운데(지나가는 방) */
  x: number;
  y: number;
  z: number;
  size: Vec3;
  /** 미끄러지는 축과 방향 */
  axis: 'x' | 'y';
  sign: 1 | -1;
  /** 가운데에서 화면 밖까지 거리 */
  reach: number;
  /** out 시작 기준 등장 시각·움직이는 시간(ms) */
  t0: number;
  dur: number;
  /** 접히는 회전축과 방향 (null이면 안 접힘) */
  fold: 'x' | 'z' | null;
  foldSign: 1 | -1;
  /** 밝기 (창 텍스처 색에 곱함) */
  b: number;
  /** 벽 칸이면 갈라질 쪽(-1 왼쪽, 1 오른쪽)과 행 */
  wall?: { side: 1 | -1; row: number };
}

export interface RoomPose {
  p: Vec3;
  r: Vec3;
  s: Vec3;
}

export interface ShiftView {
  /** 세로 시야각(도) */
  fov: number;
  aspect: number;
}

/** 지나가는 방: 한 층 거리마다 이만큼, 상한 */
const PASSERS = { low: 7, high: 14 };
const PASSERS_MAX = { low: 20, high: 40 };
/** 벽: 칸 수와 카메라에서의 거리 (지나가는 방은 모두 이보다 멀다) */
const WALL_COLS = 4;
const WALL_ROWS = 3;
const WALL_Z = 1.7;
const WALL_DEPTH = 0.5;
/** 벽이 들어오는 시간·칸별 시차 */
const WALL_IN_MS = 360;
const WALL_LEAD_MS = 700;
const WALL_STAGGER_COL = 50;
const WALL_STAGGER_ROW = 25;
const SPLIT_STAGGER_ROW = 40;

/** 인스턴스 수 상한 (메시를 한 번만 만든다) */
export function shiftRoomCapacity(low: boolean): number {
  return PASSERS_MAX[low ? 'low' : 'high'] + WALL_COLS * WALL_ROWS;
}

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** 이번 연출의 방들. seed가 같으면 같은 배치 */
export function shiftRooms(route: TransitionRoute, view: ShiftView, low: boolean, seed = 7): ShiftRoom[] {
  const r = rng(seed);
  const outMs = transitionPlan('shift', route.span).switchMs;
  const tan = Math.tan(((view.fov / 2) * Math.PI) / 180);
  const rooms: ShiftRoom[] = [];

  const tier = low ? 'low' : 'high';
  const n = Math.min(PASSERS[tier] * route.span, PASSERS_MAX[tier]);
  for (let i = 0; i < n; i++) {
    const dist = 2.6 + r() * 7;
    const halfH = dist * tan;
    const halfW = halfH * view.aspect;
    const size: Vec3 = [0.9 + r() * 1.7, 0.7 + r() * 1.1, 0.9 + r() * 1.5];
    const vertical = r() < 0.7;
    const dur = 380 + r() * 420;
    rooms.push({
      x: vertical ? (r() * 2 - 1) * halfW * 0.9 : 0,
      y: vertical ? 0 : (r() * 2 - 1) * halfH * 0.8,
      z: -dist,
      size,
      axis: vertical ? 'y' : 'x',
      // 위층(dir -1)이면 아래로, 아래층이면 위로 흐른다. 좌우는 아무 쪽으로
      sign: vertical ? route.dir : r() < 0.5 ? 1 : -1,
      reach: (vertical ? halfH : halfW) + Math.max(...size),
      // 거리가 멀수록 out이 길어지고 그 동안 고르게 지나간다
      t0: (i / n) * (outMs - WALL_LEAD_MS + 250) + r() * 120,
      dur,
      fold: r() < 0.45 ? (r() < 0.5 ? 'x' : 'z') : null,
      foldSign: r() < 0.5 ? 1 : -1,
      b: 0.35 + r() * 0.65,
    });
  }

  const halfH = WALL_Z * tan;
  const halfW = halfH * view.aspect;
  const w = (2 * halfW) / WALL_COLS;
  const h = (2 * halfH) / WALL_ROWS;
  for (let row = 0; row < WALL_ROWS; row++) {
    for (let col = 0; col < WALL_COLS; col++) {
      rooms.push({
        x: -halfW + w * (col + 0.5),
        y: -halfH + h * (row + 0.5),
        z: -WALL_Z - WALL_DEPTH / 2,
        size: [w * 1.04, h * 1.04, WALL_DEPTH],
        axis: 'y',
        sign: route.dir,
        reach: 2 * halfH + h,
        t0: outMs - WALL_LEAD_MS + col * WALL_STAGGER_COL + row * WALL_STAGGER_ROW,
        dur: WALL_IN_MS,
        fold: 'x',
        foldSign: col % 2 ? 1 : -1,
        b: 0.55 + r() * 0.35,
        wall: { side: col < WALL_COLS / 2 ? -1 : 1, row },
      });
    }
  }
  return rooms;
}

/** ms = 이 phase 시작부터 경과. 보이지 않으면 null */
export function shiftRoomPose(room: ShiftRoom, phase: TransitionPhase, ms: number, span: number): RoomPose | null {
  const fold = (a: number): Vec3 => (room.fold === 'x' ? [a, 0, 0] : room.fold === 'z' ? [0, 0, a] : [0, 0, 0]);
  if (room.wall) {
    if (phase === 'out') {
      // 흐름을 따라 들어와 제자리에 서며, 접혀 있던 판이 펴진다
      const k = easeOut(clamp01((ms - room.t0) / room.dur));
      if (k <= 0) return null;
      const off = (1 - k) * room.reach;
      return { p: [room.x, room.y - room.sign * off, room.z], r: fold(room.foldSign * (Math.PI / 2) * (1 - k)), s: room.size };
    }
    // 양옆으로 갈라지며 살짝 돌아 열린다
    const plan = transitionPlan('shift', span);
    const start = plan.revealDelayMs + room.wall.row * SPLIT_STAGGER_ROW;
    const k = easeInOut(clamp01((ms - start) / (plan.revealMs - SPLIT_STAGGER_ROW * (WALL_ROWS - 1))));
    if (k >= 1) return null;
    const away = (Math.abs(room.x) + room.size[0]) * 1.6 * k;
    return { p: [room.x + room.wall.side * away, room.y, room.z], r: [0, -room.wall.side * 0.7 * k, 0], s: room.size };
  }
  if (phase !== 'out') return null;
  const u = (ms - room.t0) / room.dur;
  if (u < 0 || u > 1) return null;
  const along = room.sign * room.reach * (2 * u - 1);
  const p: Vec3 = room.axis === 'y' ? [room.x, room.y + along, room.z] : [room.x + along, room.y, room.z];
  // 가운데를 지날 때 축을 따라 90도 접힌다
  return { p, r: fold(room.foldSign * (Math.PI / 2) * easeInOut(clamp01((u - 0.3) / 0.4))), s: room.size };
}
