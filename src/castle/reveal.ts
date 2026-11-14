// B3 심층 입장 연출의 진행 상태. 다리를 걸어 들어온 만큼 밝아지고(reach), 단 앞에 닿으면 석상이 서서히 드러난다.
// 접속(세션)당 한 번: 한 번 드러난 뒤에는 다시 와도 처음부터 밝다. 화면만의 값이라 서버로 보내지 않는다.

/** 다리에서 연출이 진행되는 구간(z, m): 도착 지점 → 단 바로 앞 */
const APPROACH = { fromZ: 27, toZ: 7 };
/** 석상이 어둠에서 다 드러나기까지 */
const EMERGE_MS = 4000;

export interface Reveal {
  /** 가장 깊이 들어온 정도 0~1 (되돌아가도 줄지 않는다) */
  reach: number;
  /** 석상이 드러난 performance.now(). 아직이면 null */
  revealedAt: number | null;
}

export function createReveal(): Reveal {
  return { reach: 0, revealedAt: null };
}

/** 내 위치(z)로 진행 상태를 갱신한다 */
export function advanceReveal(r: Reveal, z: number, now: number): void {
  const reach = (APPROACH.fromZ - z) / (APPROACH.fromZ - APPROACH.toZ);
  r.reach = Math.max(r.reach, Math.min(Math.max(reach, 0), 1));
  if (r.reach >= 1 && r.revealedAt === null) r.revealedAt = now;
}

/** 가장 깊이 들어온 z (다리 등이 켜지는 기준) */
function reachedZ(r: Reveal): number {
  return APPROACH.fromZ - r.reach * (APPROACH.fromZ - APPROACH.toZ);
}

/** 다리 등 자리(z, m). 도착 쪽부터 단 쪽 순서 */
export const LAMP_Z: readonly number[] = [24.5, 21.5, 18.5, 15.5, 12.5, 9.5];
/** 이만큼 앞의 등까지 미리 켜진다(m) */
const LAMP_AHEAD = 3.5;

/** 이 자리(z)의 등이 켜졌는가 */
export function lampOn(r: Reveal, lampZ: number): boolean {
  return reachedZ(r) <= lampZ + LAMP_AHEAD;
}

/** 마지막(단 쪽) 등까지 다 켜졌는가 */
export function allLampsOn(r: Reveal): boolean {
  return lampOn(r, LAMP_Z[LAMP_Z.length - 1]);
}

/** 드러난 정도 0~1 (천천히 시작해 천천히 끝난다). 드러나기 전은 0 */
export function revealEmerge(r: Reveal, now: number): number {
  if (r.revealedAt === null) return 0;
  const t = Math.min((now - r.revealedAt) / EMERGE_MS, 1);
  return t * t * (3 - 2 * t);
}
