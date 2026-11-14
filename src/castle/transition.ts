// 층 이동 연출 타임라인. 화면(CSS 오버레이)·3D(다다미·낙하·카메라)가 같은 시각표를 읽는다.
// 서버 ack와 무관하게 시간으로만 진행하므로 ack가 늦거나 실패해도 화면을 가린 채 멈추지 않는다.
export type TransitionKind = 'stairs' | 'door' | 'hatch' | 'return';
/** out: 트리거 → 층 전환, in: 층 전환 → 끝 */
export type TransitionPhase = 'out' | 'in';

export interface TransitionPlan {
  /** out 시작부터 덮개(페이드)가 덮이기 시작할 때까지 */
  coverDelayMs: number;
  coverMs: number;
  /** out 시작부터 층을 바꿀 때까지 (덮개가 다 덮인 뒤) */
  switchMs: number;
  /** in 시작부터 덮개가 걷히기 시작할 때까지 */
  revealDelayMs: number;
  revealMs: number;
}

export const TRANSITIONS: Record<TransitionKind, TransitionPlan> = {
  // 계단: 카메라가 내려가며 어두워짐 → 닫힌 장지문 → 좌우로 열림
  stairs: { coverDelayMs: 0, coverMs: 900, switchMs: 950, revealDelayMs: 450, revealMs: 1000 },
  // 문: 계단과 같지만 카메라가 내려가지 않는다 (광장 ↔ 건물)
  door: { coverDelayMs: 0, coverMs: 900, switchMs: 950, revealDelayMs: 450, revealMs: 1000 },
  // 해치: 다다미가 차례로 뒤집힘 → 낙하 → 붉은 페이드 → 흔들림과 함께 걷힘
  hatch: { coverDelayMs: 1150, coverMs: 550, switchMs: 1750, revealDelayMs: 150, revealMs: 800 },
  // 복귀: 화면이 반 바퀴 돌며 어두워짐 → 나머지 반 바퀴 돌며 밝아짐
  return: { coverDelayMs: 0, coverMs: 900, switchMs: 950, revealDelayMs: 0, revealMs: 900 },
};

export function transitionEndMs(kind: TransitionKind): number {
  const p = TRANSITIONS[kind];
  return p.revealDelayMs + p.revealMs;
}

/** 진행 중인 연출. 화면이 매 프레임 읽는 공유 값이라 React state가 아니다 */
export interface ActiveTransition {
  kind: TransitionKind;
  phase: TransitionPhase;
  /** 이 phase가 시작된 performance.now() */
  start: number;
}

// ── 해치 다다미: 좌우 두 짝이 가운데에서 갈라져 한 번에 아래로 열린다
const DOOR_OPEN_MS = 600;
/** 문짝이 다 열린 각도 (바깥쪽 경첩 기준, 아래로) */
const DOOR_OPEN = Math.PI * 0.6;

const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/** 문짝의 열린 각도. ms = out phase 경과 시간 */
export function hatchDoorAngle(ms: number): number {
  return DOOR_OPEN * easeOutBack(clamp01(ms / DOOR_OPEN_MS));
}

/** 다다미가 거의 다 열린 뒤 떨어지기 시작 */
const FALL_START_MS = DOOR_OPEN_MS * 0.7;
const GRAVITY = 20;

/** 해치 낙하 높이(m, 음수). 해치가 아니거나 떨어지기 전이면 0 */
export function fallDrop(t: ActiveTransition | null, now: number): number {
  if (!t || t.kind !== 'hatch' || t.phase !== 'out') return 0;
  const s = Math.max(0, now - t.start - FALL_START_MS) / 1000;
  return -0.5 * GRAVITY * s * s;
}

export interface CameraFx {
  /** 카메라 높이 보정(m) */
  dy: number;
  /** 흔들림 오프셋(m) */
  shakeX: number;
  shakeY: number;
}

const NO_FX: CameraFx = { dy: 0, shakeX: 0, shakeY: 0 };
const STAIRS_DIP = 2.6;
const SHAKE_MS = 480;
const SHAKE_AMP = 0.28;

/** 연출 중 카메라 보정: 계단은 내려가고, 해치 착지는 짧게 흔들린다 */
export function cameraFx(t: ActiveTransition | null, now: number): CameraFx {
  if (!t) return NO_FX;
  const ms = now - t.start;
  if (t.kind === 'stairs' && t.phase === 'out') {
    const k = clamp01(ms / TRANSITIONS.stairs.switchMs);
    return { ...NO_FX, dy: -STAIRS_DIP * k * k };
  }
  if (t.kind === 'hatch' && t.phase === 'in' && ms < SHAKE_MS) {
    const decay = (1 - ms / SHAKE_MS) ** 2 * SHAKE_AMP;
    return { dy: 0, shakeX: Math.sin(ms * 0.09) * decay, shakeY: Math.sin(ms * 0.13 + 1.7) * decay };
  }
  return NO_FX;
}
