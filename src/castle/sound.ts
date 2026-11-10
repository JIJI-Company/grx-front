// 사운드 훅 자리. 파일이 준비되면 여기만 구현한다 (층별 앰비언스 + 짧은 효과음).
import type { FloorId } from './protocol';

export type SoundCue = 'descend' | 'fall' | 'offer' | 'awaken';

export const castleSound = {
  ambience(_floor: FloorId | null): void {},
  cue(_name: SoundCue): void {},
};
