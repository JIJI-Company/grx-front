// 등롱 바치기 연출 타임라인. 내가 바친 것은 등롱이 날아가 내려앉은 뒤, 다른 사람이 바친 것은 곧바로
// 석상이 한 번 빛나고 바닥에 파동이 퍼진다. 밝기 단계가 오른 순간이면 빛기둥 + 더 큰 파동.
// 시각은 모두 performance.now() 기준 ms. 화면은 이 함수들의 값을 그리기만 한다.
import { lanternTier } from './protocol';
import type { MemberId } from './protocol';

/** mine: 내 lantern:offer ack 성공 / other: lantern:count로 수가 늘어남 */
export type OfferKind = 'mine' | 'other';

export interface OfferEvent {
  seq: number;
  memberId: MemberId;
  kind: OfferKind;
  /** 밝기 단계(brightness.ts)가 오른 순간 */
  tierUp: boolean;
  start: number;
  /** mine일 때 바친 사람 위치(m). 등롱이 여기 머리 위에서 떠오른다 */
  from?: { x: number; z: number };
}

export const FLIGHT_MS = 1050;
const FLASH_RISE_MS = 90;
const FLASH_DECAY_MS = 380;
const RIPPLE_MS = 1300;
const BIG_RIPPLE_MS = 1900;
const PILLAR_MS = 1600;
/** 이 시간이 지난 이벤트는 그릴 것이 없다 */
export const OFFER_FX_MS = FLIGHT_MS + Math.max(BIG_RIPPLE_MS, PILLAR_MS) + 100;

export function isTierUp(before: number, after: number): boolean {
  return lanternTier(after) > lanternTier(before);
}

/** 등롱이 석상 발치에 닿는 시각까지의 지연(ms) */
export function landingDelay(e: OfferEvent): number {
  return e.kind === 'mine' ? FLIGHT_MS : 0;
}

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export type Vec3 = [number, number, number];

export interface FlightPose {
  p: Vec3;
  /** 0 → 1: 크기 보간용 진행도 */
  k: number;
  /** 종이 발광 배율 (떠오를 때 밝아지고 내려앉으며 석상 등롱 밝기로) */
  glow: number;
}

/** 날아가는 등롱 위치: from → to 위로 볼록한 호. 비행이 끝났으면 null */
export function flightPose(e: OfferEvent, now: number, from: Vec3, to: Vec3): FlightPose | null {
  const ms = now - e.start;
  if (e.kind !== 'mine' || ms < 0 || ms > FLIGHT_MS) return null;
  const k = easeInOut(ms / FLIGHT_MS);
  // 거리에 비례한 호 높이 (가까우면 낮게, 멀면 높게)
  const arc = 0.6 + 0.25 * Math.hypot(to[0] - from[0], to[2] - from[2]);
  const y = from[1] + (to[1] - from[1]) * k + arc * 4 * k * (1 - k);
  return { p: [from[0] + (to[0] - from[0]) * k, y, from[2] + (to[2] - from[2]) * k], k, glow: 0.7 + 0.3 * Math.sin(Math.PI * k) };
}

/** 석상 반짝임 0~1: 내려앉는 순간 빠르게 올랐다가 지수로 사그라든다. tierUp이면 더 세다 */
export function statueFlash(e: OfferEvent, now: number): number {
  const ms = now - e.start - landingDelay(e);
  if (ms < 0) return 0;
  const amp = e.tierUp ? 1 : e.kind === 'mine' ? 0.7 : 0.45;
  if (ms < FLASH_RISE_MS) return amp * (ms / FLASH_RISE_MS);
  const v = amp * Math.exp(-(ms - FLASH_RISE_MS) / (e.tierUp ? FLASH_DECAY_MS * 1.8 : FLASH_DECAY_MS));
  return v < 0.005 ? 0 : v;
}

export interface Ripple {
  /** 반지름 (석상 scale 1 기준, m) */
  radius: number;
  opacity: number;
}

/** 바닥 파동: 받침대 둘레에서 바깥으로 퍼지며 옅어진다. 없으면 null */
export function ripple(e: OfferEvent, now: number): Ripple | null {
  const ms = now - e.start - landingDelay(e);
  const dur = e.tierUp ? BIG_RIPPLE_MS : RIPPLE_MS;
  if (ms < 0 || ms > dur) return null;
  const t = ms / dur;
  const reach = e.tierUp ? 6.5 : 3.6;
  const ease = 1 - (1 - t) ** 3;
  return { radius: 0.8 + (reach - 0.8) * ease, opacity: (e.tierUp ? 1 : 0.8) * (1 - t) ** 1.5 };
}

export interface Pillar {
  /** 높이 (석상 scale 1 기준, m) */
  height: number;
  opacity: number;
}

/** 단계가 오른 순간 석상에서 위로 솟는 빛기둥. tierUp이 아니거나 끝났으면 null */
export function pillar(e: OfferEvent, now: number): Pillar | null {
  if (!e.tierUp) return null;
  const ms = now - e.start - landingDelay(e);
  if (ms < 0 || ms > PILLAR_MS) return null;
  const t = ms / PILLAR_MS;
  return { height: 9 * (1 - (1 - clamp01(t / 0.25)) ** 3), opacity: 0.9 * (t < 0.25 ? 1 : 1 - (t - 0.25) / 0.75) };
}
