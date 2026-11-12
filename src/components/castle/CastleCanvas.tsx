// 3D 캔버스: 층 장면 + 석상 + 나/다른 사람 + 카메라 + 후처리. 데이터는 받은 그대로 그린다.
// 후처리 순서: 블룸(HDR) → ACES 톤 매핑 → 층별 색감 → (B3) 색수차 → 비네트.
import { useMemo, useState, type MutableRefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import type { FloorId } from '../../castle/protocol';
import { isLowSpec } from '../../castle/quality';
import type { CastleSession } from '../../castle/session';
import type { ActiveTransition, TransitionKind } from '../../castle/transition';
import type { CameraView } from '../../castle/view';
import ColorGrade from './ColorGrade';
import FloorScene from './floors/FloorScene';
import FollowCamera from './FollowCamera';
import { RemoteOni } from './Oni';
import OfferFx from './OfferFx';
import Player from './Player';
import Statue from './Statue';

const DPR_MAX = 1.5;
const ABERRATION = new THREE.Vector2(0.0011, 0.0007);

interface CastleCanvasProps {
  session: CastleSession;
  floor: FloorDef;
  statues: PlacedStatue[];
  onTrigger: (to: FloorId, fade: string, effect: TransitionKind) => void;
  onNear: (s: PlacedStatue | null) => void;
  view: CameraView;
  fx: MutableRefObject<ActiveTransition | null>;
}

export default function CastleCanvas({ session, floor, statues, onTrigger, onNear, view, fx }: CastleCanvasProps) {
  const [dpr, setDpr] = useState(DPR_MAX);
  const low = useMemo(() => isLowSpec(), []);
  const { store } = session;
  return (
    <Canvas dpr={[1, dpr]} camera={{ fov: 50, near: 0.1, far: 600 }} gl={{ antialias: false }} aria-hidden>
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(DPR_MAX)} />
      <FloorScene floor={floor} statues={statues} low={low} fx={fx} motion={session.motion} reveal={session.reveal} />
      {statues.map((s) => (
        <Statue
          key={s.memberId}
          statue={s}
          count={store.lanternCount(s.memberId)}
          awake={store.isLive(s.memberId)}
          offers={store.offerEvents.filter((e) => e.memberId === s.memberId)}
          reveal={floor.id === 'B3' ? session.reveal : undefined}
        />
      ))}
      {store.offerEvents.map((e) => {
        const st = statues.find((s) => s.memberId === e.memberId);
        return st && <OfferFx key={e.seq} event={e} statue={st} floor={floor} />;
      })}
      <Player key={floor.id} session={session} floor={floor} statues={statues} onTrigger={onTrigger} onNear={onNear} view={view} fx={fx} low={low} />
      {store.peers.map((p) => (
        <RemoteOni key={p.id} peer={p} floor={floor} />
      ))}
      <FollowCamera floor={floor} motion={session.motion} view={view} look={session.look} fx={fx} />
      <EffectComposer multisampling={low ? 0 : 4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.7} resolutionScale={low ? 0.5 : 1} levels={low ? 5 : 8} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <ColorGrade grade={floor.grade} />
        {floor.id === 'B3' ? <ChromaticAberration offset={ABERRATION} radialModulation modulationOffset={0.3} /> : <></>}
        <Vignette offset={0.3} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
