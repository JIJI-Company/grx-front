// 등롱 수 → 석상 밝기. 단계 구분(lanternTier)은 서버와 같은 값이어야 해서 protocol.ts에 있다.
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

// emissive·light는 PoC에서 맞춘 값. reach·pool은 단계가 오를수록 넓게
const GLOW: Record<LanternTier, StatueGlow> = {
  0: { emissive: 0, light: 0.4, reach: 4, pool: 0, poolRadius: 1 },
  1: { emissive: 0.05, light: 6, reach: 6, pool: 0.12, poolRadius: 1.4 },
  2: { emissive: 0.12, light: 14, reach: 7.5, pool: 0.22, poolRadius: 1.9 },
  3: { emissive: 0.22, light: 26, reach: 9, pool: 0.34, poolRadius: 2.5 },
  4: { emissive: 0.38, light: 45, reach: 11, pool: 0.5, poolRadius: 3.2 },
};

export function statueGlow(tier: LanternTier): StatueGlow {
  return GLOW[tier];
}

/** 발치에 놓이는 등롱 모형 수 (draw call 상한) */
export const MAX_LANTERN_MODELS = 12;
