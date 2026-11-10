// 내 캐릭터: 매 프레임 입력 → 이동 → 트리거·석상 판정 → 전송. React state를 거치지 않는다.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import { FloorTriggerTracker, nearestStatue, stepMotion } from '../../castle/movement';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import { Oni } from './Oni';

interface PlayerProps {
  session: CastleSession;
  floor: FloorDef;
  statues: PlacedStatue[];
  onTrigger: (to: FloorId, fade: string) => void;
  onNear: (s: PlacedStatue | null) => void;
}

export default function Player({ session, floor, statues, onTrigger, onNear }: PlayerProps) {
  const ref = useRef<THREE.Group>(null!);
  const tracker = useRef(new FloorTriggerTracker());
  const near = useRef<PlacedStatue | null>(null);
  const m = session.motion;

  useFrame((_, dt) => {
    const moved = stepMotion(m, session.input.read(), floor, dt);
    const hit = tracker.current.update(floor, m, moved);
    if (hit) onTrigger(hit.to, hit.fade);

    const best = nearestStatue(statues, m.x, m.z);
    if (best !== near.current) {
      near.current = best;
      onNear(best);
    }

    ref.current.position.set(m.x, floor.heightAt(m.x, m.z), m.z);
    ref.current.rotation.y = m.rot;
    session.reportMotion();
  });

  return (
    <group ref={ref}>
      <Oni hornColor={session.profile.hornColor} nickname={session.profile.nickname} getSpeed={() => m.speed} getBowSeq={() => session.offerSeq} isMe />
      {/* 내가 든 작은 등불: 어두운 성에서 주변만 비춘다 */}
      <pointLight position={[0.4, 1.7, 0.6]} color="#ffb870" intensity={9} distance={9} decay={1.5} />
    </group>
  );
}
