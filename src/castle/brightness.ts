// 등롱 수 → 석상 밝기. 단계 구분(lanternTier)은 서버와 같은 값이어야 해서 protocol.ts에 있다.
import { lanternTier } from './protocol';

export { lanternTier };
export type LanternTier = ReturnType<typeof lanternTier>;

export interface StatueGlow {
  /** 석상 몸체 emissiveIntensity */
  emissive: number;
  /** 석상 앞 pointLight 세기 (scale 1 기준) */
  light: number;
}

// PoC에서 맞춘 값
const GLOW: Record<LanternTier, StatueGlow> = {
  0: { emissive: 0, light: 0.4 },
  1: { emissive: 0.05, light: 6 },
  2: { emissive: 0.12, light: 14 },
  3: { emissive: 0.22, light: 26 },
  4: { emissive: 0.38, light: 45 },
};

export function statueGlow(tier: LanternTier): StatueGlow {
  return GLOW[tier];
}

/** 발치에 놓이는 등롱 모형 수 (draw call 상한) */
export const MAX_LANTERN_MODELS = 12;
