// 층 번호 → 층 장면. 배경색·안개는 floors.ts 정의를 그대로 쓴다.
import type { MutableRefObject } from 'react';
import type { FloorDef, PlacedStatue } from '../../../castle/floors';
import type { Motion } from '../../../castle/movement';
import type { Reveal } from '../../../castle/reveal';
import type { ActiveTransition } from '../../../castle/transition';
import SceneB1 from './SceneB1';
import SceneB2 from './SceneB2';
import SceneB3 from './SceneB3';

/** low: 저사양 모드 (castle/quality.ts) — 입자 수·거울 반사를 줄인다 */
interface FloorSceneProps {
  floor: FloorDef;
  statues: PlacedStatue[];
  low: boolean;
  /** 층 이동 연출 (B2 해치 다다미가 읽는다) */
  fx: MutableRefObject<ActiveTransition | null>;
  /** 내 위치와 B3 입장 연출 진행 (B3 장면이 읽는다) */
  motion: Motion;
  reveal: Reveal;
}

export default function FloorScene({ floor, statues, low, fx, motion, reveal }: FloorSceneProps) {
  return (
    <>
      <color attach="background" args={[floor.fog]} />
      <fogExp2 attach="fog" args={[floor.fog, floor.fogDensity]} />
      {floor.id === 'B1' && <SceneB1 />}
      {floor.id === 'B2' && <SceneB2 statues={statues} fx={fx} />}
      {floor.id === 'B3' && <SceneB3 low={low} motion={motion} reveal={reveal} />}
    </>
  );
}
