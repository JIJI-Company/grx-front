// 층 번호 → 층 장면. 배경색·안개는 floors.ts 정의를 그대로 쓴다.
import type { MutableRefObject } from 'react';
import type { FloorDef, PlacedStatue } from '../../../castle/floors';
import type { HistoryMemberProfileMap } from '../../history/historyPresentation';
import HistoryHallScene from '../spaces/HistoryHallScene';
import type { HallRecord } from '../spaces/historyHallPresentation';
import GalleryScene from '../spaces/GalleryScene';
import PlazaScene from '../spaces/PlazaScene';
import type { ContentsArchiveItem } from '../../../api/types';
import type { BoardDay } from '../spaces/schedulePresentation';
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
  /** History 전당 전시 (전당에서만 쓴다) */
  hall: { records: HallRecord[]; profiles: HistoryMemberProfileMap };
  /** 광장 게시판의 이번 주 일정 */
  plaza: { days: BoardDay[] };
  /** Content 화랑 포스터와, 가까이 간 포스터 알림 */
  gallery: { items: ContentsArchiveItem[]; onNear: (item: ContentsArchiveItem | null) => void };
}

export default function FloorScene({ floor, statues, low, fx, motion, reveal, hall, plaza, gallery }: FloorSceneProps) {
  return (
    <>
      <color attach="background" args={[floor.fog]} />
      <fogExp2 attach="fog" args={[floor.fog, floor.fogDensity]} />
      {floor.id === 'PLAZA' && <PlazaScene low={low} days={plaza.days} />}
      {floor.id === 'HISTORY' && <HistoryHallScene records={hall.records} memberProfiles={hall.profiles} low={low} focus={motion} />}
      {floor.id === 'CONTENT' && <GalleryScene items={gallery.items} low={low} focus={motion} onNear={gallery.onNear} />}
      {floor.id === 'B1' && <SceneB1 />}
      {floor.id === 'B2' && <SceneB2 statues={statues} fx={fx} />}
      {floor.id === 'B3' && <SceneB3 low={low} motion={motion} reveal={reveal} />}
    </>
  );
}
