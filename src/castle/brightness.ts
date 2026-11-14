// 등롱 수 → 석상 밝기. 단계 구분(lanternTier)은 서버와 같은 값이어야 해서 protocol.ts에 있다.
import * as THREE from 'three';
import { lanternTier } from './protocol';

export { lanternTier };
export type LanternTier = ReturnType<typeof lanternTier>;

export interface StatueGlow {
  /** 석상 몸체 emissiveIntensity */
  emissive: number;
  /** 석상 앞 pointLight 세기 (scale 1 기준) */
  light: number;
  /** pointLight 도달 거리(m, scale 1 기준) */
  reach: number;
  /** 발치 바닥 빛 번짐: 불투명도, 반지름(m, scale 1 기준) */
  pool: number;
  poolRadius: number;
}

// 석상 몸 자체는 빛나지 않는다(emissive 0 — 몸 발광은 촌스러워 보여 2026-11-14에 뺐다).
// 등롱이 쌓이면 멤버 색 빛이 석상을 비추고(light·reach), 발치에 빛이 번진다(pool). 단계가 오를수록 넓게.
// 광원은 석상에서 떨어져 있어(Statue.tsx) 가까이서 봐도 고르게 은은하다. 높은 단계는 세기보다 넓이로 차이를 낸다
const GLOW: Record<LanternTier, StatueGlow> = {
  0: { emissive: 0, light: 0.6, reach: 5, pool: 0, poolRadius: 1 },
  1: { emissive: 0, light: 11, reach: 7, pool: 0.12, poolRadius: 1.4 },
  2: { emissive: 0, light: 24, reach: 8.5, pool: 0.2, poolRadius: 1.9 },
  3: { emissive: 0, light: 34, reach: 10, pool: 0.28, poolRadius: 2.5 },
  4: { emissive: 0, light: 42, reach: 12, pool: 0.36, poolRadius: 3.2 },
};

export function statueGlow(tier: LanternTier): StatueGlow {
  return GLOW[tier];
}

/** 발치에 놓이는 등롱 모형 수 (draw call 상한) */
export const MAX_LANTERN_MODELS = 12;

// 멤버 퍼스널 컬러는 원색(#FFFF00·#FF0000)부터 아주 어두운 색(#2E5A88)까지 제각각이라 그대로 빛으로 쓰면
// 원색은 눈이 아프고 어두운 색은 빛이 거의 안 보인다. 색상(hue)은 지키고 채도·명도만 빛에 알맞은 폭으로 모은다
const LIGHT_SAT_MAX = 0.6;
const LIGHT_L_MIN = 0.5;
const LIGHT_L_MAX = 0.68;

/** 퍼스널 컬러 → 석상 빛·발치 번짐에 쓰는 은은한 색 */
export function statueLightColor(personalColor: string): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(personalColor).getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, Math.min(hsl.s, LIGHT_SAT_MAX), THREE.MathUtils.clamp(hsl.l, LIGHT_L_MIN, LIGHT_L_MAX));
}
