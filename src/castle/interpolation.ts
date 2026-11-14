// 다른 사람 상태 버퍼 → 100ms 과거 시점 보간, 패킷이 늦으면 최대 200ms 외삽 후 정지 (계획서 §2-2)
export const INTERP_DELAY_MS = 100;
export const EXTRAPOLATE_MAX_MS = 200;
/** 보간 결과로 부드럽게 따라가는 시간 상수(s). 순간이동 대신 짧게 보정 */
export const CORRECTION_TAU = 0.06;
const MAX_SAMPLES = 20;
const MOVING = 0.05;

export interface Sample {
  t: number;
  x: number;
  z: number;
  rot: number;
  speed: number;
}

/** 각도를 -π~π로 접는다 */
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function lerpAngle(a: number, b: number, k: number): number {
  return a + wrapAngle(b - a) * k;
}

/** dt 동안 tau 시간 상수로 목표에 다가가는 보간 계수 (프레임레이트 독립) */
export const approach = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);

export class InterpolationBuffer {
  private samples: Sample[];

  constructor(first: Sample) {
    this.samples = [first];
  }

  get latest(): Sample {
    return this.samples[this.samples.length - 1];
  }

  push(s: Sample): void {
    this.samples.push(s);
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
  }

  /** 시각 t(ms)의 상태 */
  sampleAt(t: number): Sample {
    const buf = this.samples;
    const last = this.latest;
    if (t >= last.t) {
      const prev = buf[buf.length - 2];
      if (!prev || last.speed < MOVING) return last;
      const ahead = Math.min(t - last.t, EXTRAPOLATE_MAX_MS) / 1000;
      const dt = (last.t - prev.t) / 1000 || 0.1;
      return { ...last, x: last.x + ((last.x - prev.x) / dt) * ahead, z: last.z + ((last.z - prev.z) / dt) * ahead };
    }
    for (let i = buf.length - 1; i > 0; i--) {
      const a = buf[i - 1];
      const b = buf[i];
      if (t >= a.t && t <= b.t) {
        const k = (t - a.t) / (b.t - a.t || 1);
        return { t, x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, rot: lerpAngle(a.rot, b.rot, k), speed: a.speed + (b.speed - a.speed) * k };
      }
    }
    return buf[0];
  }
}

/** 화면에 그릴 표시 상태: 보간 결과를 CORRECTION_TAU로 따라간다 */
export function smoothToward(cur: Sample, target: Sample, dt: number): void {
  const k = approach(dt, CORRECTION_TAU);
  cur.x += (target.x - cur.x) * k;
  cur.z += (target.z - cur.z) * k;
  cur.rot = lerpAngle(cur.rot, target.rot, k);
  cur.speed = target.speed;
}
