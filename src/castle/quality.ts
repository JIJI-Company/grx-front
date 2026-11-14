// 저사양 판정 하나로 블룸 해상도·입자 수·거울 반사를 함께 낮춘다.
export interface DisplayEnv {
  /** 터치 위주 기기 (pointer: coarse) */
  coarse: boolean;
}

export function readDisplayEnv(): DisplayEnv {
  return { coarse: window.matchMedia('(pointer: coarse)').matches };
}

/** 터치 기기만 저사양 모드. 데스크톱은 화면 배율(1배 모니터 포함)과 무관하게 거울 반사 등을 켠다 */
export function isLowSpec(env: DisplayEnv = readDisplayEnv()): boolean {
  return env.coarse;
}
