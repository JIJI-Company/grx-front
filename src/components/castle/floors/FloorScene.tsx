// 층 번호 → 층 장면. 배경색·안개는 floors.ts 정의를 그대로 쓴다.
import type { FloorDef, PlacedStatue } from '../../../castle/floors';
import SceneB1 from './SceneB1';
import SceneB2 from './SceneB2';
import SceneB3 from './SceneB3';

export default function FloorScene({ floor, statues }: { floor: FloorDef; statues: PlacedStatue[] }) {
  return (
    <>
      <color attach="background" args={[floor.fog]} />
      <fogExp2 attach="fog" args={[floor.fog, floor.fogDensity]} />
      {floor.id === 'B1' && <SceneB1 />}
      {floor.id === 'B2' && <SceneB2 statues={statues} />}
      {floor.id === 'B3' && <SceneB3 />}
    </>
  );
}
