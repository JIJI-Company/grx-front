// 카메라 궤도 계산 (화면과 분리된 순수 함수).
// - 3인칭 회전: 꾸로를 중심으로 카메라 yaw만큼 돈다. 이동 방향도 같은 yaw를 쓴다(input.ts toWorld).
// - 석상 감상: 가까운 석상을 중심으로 yaw·pitch·zoom으로 돈다. 내 화면 설정이라 서버와 무관하다.
// - 카메라 상자: 좁은 층(B1 복도)에서 카메라가 벽·천장 밖으로 나가지 않게 중심 쪽으로 당긴다.
import type { StatueSlot } from './floors';

export type Vec3 = [number, number, number];

/** 카메라가 머물 수 있는 범위(m). 바닥 쪽은 FLOOR_Y로 공통 */
export interface CameraBox {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** 천장 아래 높이 */
  y1: number;
}

const FLOOR_Y = 0.3;

/** center → desired 선분을 상자 안에 들어오는 데까지 줄인다. center는 상자 안이라고 본다 */
export function clampToBox(center: Vec3, desired: Vec3, box?: CameraBox): Vec3 {
  if (!box) return desired;
  const lo: Vec3 = [box.x0, FLOOR_Y, box.z0];
  const hi: Vec3 = [box.x1, box.y1, box.z1];
  let t = 1;
  for (let a = 0; a < 3; a++) {
    const d = desired[a] - center[a];
    if (desired[a] > hi[a] && d > 0) t = Math.min(t, (hi[a] - center[a]) / d);
    if (desired[a] < lo[a] && d < 0) t = Math.min(t, (lo[a] - center[a]) / d);
  }
  t = Math.max(0, t);
  return [center[0] + (desired[0] - center[0]) * t, center[1] + (desired[1] - center[1]) * t, center[2] + (desired[2] - center[2]) * t];
}

/** (x, z)를 y축으로 yaw만큼 돌린다. three.js rotation.y와 같은 방향(yaw 0이면 그대로) */
export function rotateXZ(x: number, z: number, yaw: number): [number, number] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [x * c + z * s, -x * s + z * c];
}

// ── 석상 감상
export interface InspectView {
  /** 석상 정면 기준 돌린 각도(rad). 0 = 정면, π = 뒤 */
  yaw: number;
  pitch: number;
  zoom: number;
}

export const INSPECT_LIMITS = { pitchMin: -0.15, pitchMax: 0.85, zoomMin: 0.55, zoomMax: 1.7 } as const;

export const initialInspect = (): InspectView => ({ yaw: 0, pitch: 0.18, zoom: 1 });

/** 드래그(px)·휠(deltaY)을 감상 시점에 반영한다. 오른쪽으로 끌면 석상이 오른쪽으로 돈다 */
export function turnInspect(v: InspectView, dx: number, dy: number, sensitivity: number): void {
  v.yaw -= dx * sensitivity;
  v.pitch = Math.max(INSPECT_LIMITS.pitchMin, Math.min(INSPECT_LIMITS.pitchMax, v.pitch + dy * sensitivity));
}

export function zoomInspect(v: InspectView, deltaY: number): void {
  v.zoom = Math.max(INSPECT_LIMITS.zoomMin, Math.min(INSPECT_LIMITS.zoomMax, v.zoom * Math.exp(deltaY * 0.001)));
}

/** 석상 몸 가운데 (받침대 0.6 + 몸 2.4 → 1.7 지점) */
export function inspectCenter(s: StatueSlot): Vec3 {
  return [s.x, s.lift + 1.7 * s.scale, s.z];
}

/** 감상 카메라 위치. 석상 정면(로컬 +z)에서 시작해 yaw만큼 돈다 */
export function inspectEye(s: StatueSlot, v: InspectView): Vec3 {
  const [cx, cy, cz] = inspectCenter(s);
  const r = 3.6 * s.scale * v.zoom;
  const a = s.rotY + v.yaw;
  const flat = Math.cos(v.pitch) * r;
  return [cx + Math.sin(a) * flat, cy + Math.sin(v.pitch) * r, cz + Math.cos(a) * flat];
}
