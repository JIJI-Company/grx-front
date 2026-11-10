// 내 캐릭터 이동: 가속·감속(0.12s), 벽 미끄러짐, 진행 방향 회전(0.1s), 층 이동 트리거, 가까운 석상.
// navmesh가 들어오기 전까지 걸을 수 있는 영역은 floors.ts의 사각형 목록이다.
import { inRect, isWalkable, type FloorDef, type PlacedStatue } from './floors';
import { approach, lerpAngle } from './interpolation';
import type { MoveAxis } from './input';
import type { FloorId } from './protocol';

export const WALK_SPEED = 4.2;
export const RUN_SPEED = 7.5;
const ACCEL_TAU = 0.12;
const TURN_TAU = 0.1;
const MAX_DT = 0.05;

export interface Motion {
  x: number;
  z: number;
  rot: number;
  speed: number;
  vx: number;
  vz: number;
  /** 층 이동 연출 중에는 입력을 무시 */
  frozen: boolean;
}

export function createMotion(x: number, z: number): Motion {
  return { x, z, rot: Math.PI, speed: 0, vx: 0, vz: 0, frozen: false };
}

export function placeMotion(m: Motion, x: number, z: number): void {
  Object.assign(m, { x, z, vx: 0, vz: 0, speed: 0, rot: Math.PI });
}

/** 한 프레임 이동. 실제 이동 거리(m)를 돌려준다 */
export function stepMotion(m: Motion, axis: MoveAxis, floor: FloorDef, dtRaw: number): number {
  const dt = Math.min(dtRaw, MAX_DT);
  const max = axis.run ? RUN_SPEED : WALK_SPEED;
  const tx = m.frozen ? 0 : axis.x * max;
  const tz = m.frozen ? 0 : axis.z * max;
  const k = approach(dt, ACCEL_TAU);
  m.vx += (tx - m.vx) * k;
  m.vz += (tz - m.vz) * k;

  const ox = m.x;
  const oz = m.z;
  const nx = m.x + m.vx * dt;
  const nz = m.z + m.vz * dt;
  if (isWalkable(floor, nx, nz)) {
    m.x = nx;
    m.z = nz;
  } else if (isWalkable(floor, nx, m.z)) {
    m.x = nx; // 벽을 따라 미끄러짐
    m.vz = 0;
  } else if (isWalkable(floor, m.x, nz)) {
    m.z = nz;
    m.vx = 0;
  } else {
    m.vx = m.vz = 0;
  }
  const moved = Math.hypot(m.x - ox, m.z - oz);
  m.speed = dt > 0 ? moved / dt : 0;
  if (m.speed > 0.15) m.rot = lerpAngle(m.rot, Math.atan2(m.vx, m.vz), approach(dt, TURN_TAU));
  return moved;
}

/** 트리거 구역 안에서 누적 이동 거리가 기준을 넘으면 목적지 층을 돌려준다 */
export class FloorTriggerTracker {
  private acc = 0;

  update(floor: FloorDef, m: Motion, moved: number): { to: FloorId; fade: string } | null {
    const t = floor.triggers.find((tr) => inRect(tr.rect, m.x, m.z));
    if (!t || m.frozen) {
      this.acc = 0;
      return null;
    }
    this.acc += moved;
    if (this.acc < t.meters) return null;
    this.acc = 0;
    return { to: t.to, fade: t.fade };
  }
}

/** 상호작용 반경 안에서 가장 가까운 석상 (석상이 클수록 반경도 넓다) */
export function nearestStatue(statues: PlacedStatue[], x: number, z: number): PlacedStatue | null {
  let best: PlacedStatue | null = null;
  let bestD = Infinity;
  for (const s of statues) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < 1.6 + s.scale * 1.2 && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}
