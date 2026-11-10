// 3D 캔버스: 층 장면 + 석상 + 나/다른 사람 + 카메라 + 후처리(블룸·비네트). 데이터는 받은 그대로 그린다.
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import FloorScene from './floors/FloorScene';
import FollowCamera from './FollowCamera';
import { RemoteOni } from './Oni';
import Player from './Player';
import Statue from './Statue';

const DPR_MAX = 1.5;

interface CastleCanvasProps {
  session: CastleSession;
  floor: FloorDef;
  statues: PlacedStatue[];
  onTrigger: (to: FloorId, fade: string) => void;
  onNear: (s: PlacedStatue | null) => void;
}

export default function CastleCanvas({ session, floor, statues, onTrigger, onNear }: CastleCanvasProps) {
  const [dpr, setDpr] = useState(DPR_MAX);
  const { store } = session;
  return (
    <Canvas dpr={[1, dpr]} camera={{ fov: 50, near: 0.1, far: 600 }} gl={{ antialias: false }} aria-hidden>
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(DPR_MAX)} />
      <FloorScene floor={floor} statues={statues} />
      {statues.map((s) => (
        <Statue key={s.memberId} statue={s} count={store.lanternCount(s.memberId)} awake={store.isLive(s.memberId)} />
      ))}
      <Player key={floor.id} session={session} floor={floor} statues={statues} onTrigger={onTrigger} onNear={onNear} />
      {store.peers.map((p) => (
        <RemoteOni key={p.id} peer={p} floor={floor} />
      ))}
      <FollowCamera floor={floor} motion={session.motion} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.7} />
        <Vignette offset={0.3} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
