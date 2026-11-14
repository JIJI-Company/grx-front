// 층 이동 연출 타임라인. 화면(CSS 오버레이)·3D(다다미·낙하·카메라)가 같은 시각표를 읽는다.
// 서버 ack와 무관하게 시간으로만 진행하므로 ack가 늦거나 실패해도 화면을 가린 채 멈추지 않는다.
import type { FloorId } from './protocol';

/** shift: 장지문 방들이 재배치되며 층을 옮긴다(HUD 이동·위층 복귀). fade: shift의 동작 줄이기(prefers-reduced-motion) 대체 */
export type TransitionKind = 'stairs' | 'door' | 'hatch' | 'shift' | 'fade';
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

const TRANSITIONS: Record<Exclude<TransitionKind, 'shift'>, TransitionPlan> = {
  // 계단: 카메라가 내려가며 어두워짐 → 닫힌 장지문 → 좌우로 열림
  stairs: { coverDelayMs: 0, coverMs: 900, switchMs: 950, revealDelayMs: 450, revealMs: 1000 },
  // 문: 계단과 같지만 카메라가 내려가지 않는다 (광장 ↔ 건물)
  door: { coverDelayMs: 0, coverMs: 900, switchMs: 950, revealDelayMs: 450, revealMs: 1000 },
  // 해치: 다다미가 차례로 뒤집힘 → 낙하 → 붉은 페이드 → 흔들림과 함께 걷힘
  hatch: { coverDelayMs: 1150, coverMs: 550, switchMs: 1750, revealDelayMs: 150, revealMs: 800 },
  // 페이드: 어두워졌다 밝아질 뿐 (shift의 동작 줄이기 대체)
  fade: { coverDelayMs: 0, coverMs: 500, switchMs: 550, revealDelayMs: 0, revealMs: 500 },
};

// ── 재배치(shift): out 동안 방들이 스쳐 지나가고 마지막 벽이 시야를 덮는다 → in에서 벽이 양옆으로 갈라진다
/** 한 층 거리일 때 out 길이. 한 층 멀어질 때마다 SHIFT_OUT_STEP씩 늘고 SHIFT_OUT_MAX에서 멈춘다 */
const SHIFT_OUT_MS = 850;
const SHIFT_OUT_STEP = 500;
const SHIFT_OUT_MAX = 1850;
/** in: 덮개가 걷힌 뒤 벽이 갈라지기 시작할 때까지 / 갈라지는 시간 */
const SHIFT_SPLIT_DELAY = 120;
const SHIFT_SPLIT_MS = 600;
/** 층이 바뀌기 직전 이만큼 동안 덮개를 덮는다 (벽 틈으로 층 교체가 보이지 않게) */
const SHIFT_COVER_MS = 200;

/** 연출의 시각표. shift만 층 거리(span)에 따라 늘어난다 — 최대 SHIFT_OUT_MAX + 820ms */
export function transitionPlan(kind: TransitionKind, span = 1): TransitionPlan {
  if (kind !== 'shift') return TRANSITIONS[kind];
  const out = Math.min(SHIFT_OUT_MS + SHIFT_OUT_STEP * (span - 1), SHIFT_OUT_MAX);
  return { coverDelayMs: out - SHIFT_COVER_MS - 20, coverMs: SHIFT_COVER_MS, switchMs: out, revealDelayMs: SHIFT_SPLIT_DELAY, revealMs: SHIFT_SPLIT_MS };
}

export function transitionEndMs(kind: TransitionKind, span = 1): number {
  const p = transitionPlan(kind, span);
  return p.revealDelayMs + p.revealMs;
}

/** shift 거리를 재는 층 순서 (위 → 아래). 광장 옆 건물은 문 연출이라 없다 */
const DEPTH: readonly FloorId[] = ['PLAZA', 'B1', 'B2', 'B3'];

export interface TransitionRoute {
  /** +1: 아래층으로, -1: 위층으로 */
  dir: 1 | -1;
  /** 층 거리 (DEPTH의 index 차, 최소 1) */
  span: number;
}

/** from → to의 방향·거리. DEPTH에 없는 층(건물)은 광장 높이로 본다 */
export function transitionRoute(from: FloorId, to: FloorId): TransitionRoute {
  const depth = (f: FloorId) => Math.max(DEPTH.indexOf(f), 0);
  const d = depth(to) - depth(from);
  return { dir: d >= 0 ? 1 : -1, span: Math.max(Math.abs(d), 1) };
}

/** 동작 줄이기면 shift를 단순 페이드로 */
export function effectiveKind(kind: TransitionKind, reducedMotion: boolean): TransitionKind {
  return kind === 'shift' && reducedMotion ? 'fade' : kind;
}

/** 진행 중인 연출. 화면이 매 프레임 읽는 공유 값이라 React state가 아니다 */
export interface ActiveTransition extends TransitionRoute {
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

/** 연출 중 카메라 보정: 계단은 내려가고, 해치 착지·재배치 벽이 갈라질 때는 짧게 흔들린다 */
export function cameraFx(t: ActiveTransition | null, now: number): CameraFx {
  if (!t) return NO_FX;
  // 재배치는 벽이 갈라지기 시작할 때 흔들린다
  const ms = now - t.start - (t.kind === 'shift' && t.phase === 'in' ? SHIFT_SPLIT_DELAY : 0);
  if (t.kind === 'stairs' && t.phase === 'out') {
    const k = clamp01(ms / TRANSITIONS.stairs.switchMs);
    return { ...NO_FX, dy: -STAIRS_DIP * k * k };
  }
  if ((t.kind === 'hatch' || t.kind === 'shift') && t.phase === 'in' && ms >= 0 && ms < SHAKE_MS) {
    const decay = (1 - ms / SHAKE_MS) ** 2 * SHAKE_AMP;
    return { dy: 0, shakeX: Math.sin(ms * 0.09) * decay, shakeY: Math.sin(ms * 0.13 + 1.7) * decay };
  }
  return NO_FX;
}
