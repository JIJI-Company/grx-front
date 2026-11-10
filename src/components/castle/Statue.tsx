// 석상 (임시 도형): 등롱 수에 따라 멤버 색으로 밝아지고, 방송 중이면 눈이 빛난다(각성).
import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { lanternTier, MAX_LANTERN_MODELS, statueGlow } from '../../castle/brightness';
import type { PlacedStatue } from '../../castle/floors';
import { lanternCountLabel, statueCaption } from './castlePresentation';
import LanternRing from './LanternRing';

const AWAKE_EYE_BOOST = 6; // 1을 넘겨야 블룸이 잡힌다
const DORMANT_EYE = '#2a2226';

export default function Statue({ statue: s, count, awake }: { statue: PlacedStatue; count: number; awake: boolean }) {
  const tier = lanternTier(count);
  const glow = statueGlow(tier);
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6d6669', roughness: 0.85, emissive: new THREE.Color(s.color), emissiveIntensity: 0 }),
    [s.color],
  );
  const eye = useMemo(() => {
    if (awake) return new THREE.Color(s.color).multiplyScalar(AWAKE_EYE_BOOST);
    return new THREE.Color(tier > 0 ? s.color : DORMANT_EYE);
  }, [awake, tier, s.color]);
  const lanterns = Math.min(count, MAX_LANTERN_MODELS);
  const root = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    stone.emissiveIntensity += (glow.emissive - stone.emissiveIntensity) * 0.05; // 단계 변화를 부드럽게
    if (s.float) root.current.position.y = s.lift + Math.sin(clock.elapsedTime * 0.6) * 0.35;
  });

  return (
    <group ref={root} position={[s.x, s.lift, s.z]} rotation={[0, s.rotY, 0]}>
      <group scale={s.scale}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.5, 0.6, 1.5]} />
          <meshStandardMaterial color="#231d1f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={stone}>
          <cylinderGeometry args={[0.42, 0.62, 1.5, 14]} />
        </mesh>
        <mesh position={[0, 1.95, 0]} material={stone}>
          <boxGeometry args={[1.25, 0.32, 0.55]} />
        </mesh>
        <mesh position={[0, 2.42, 0]} material={stone}>
          <sphereGeometry args={[0.36, 18, 14]} />
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 2.82, 0]} rotation={[0, 0, -x * 1.6]} material={stone}>
            <coneGeometry args={[0.08, 0.42, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 2.45, 0.33]}>
          <boxGeometry args={[0.38, 0.05, 0.05]} />
          <meshBasicMaterial color={eye} toneMapped={!awake} />
        </mesh>
        {/* 발치 등롱 */}
        <Suspense fallback={null}>
          <LanternRing count={lanterns} color={s.color} />
        </Suspense>
      </group>
      <pointLight position={[0, 1.4 * s.scale, 1.6 * s.scale]} color={s.color} intensity={glow.light * s.scale} distance={7 * s.scale} decay={1.6} />
      {/* distanceFactor: 먼 석상 이름표는 작아져서 서로 겹치지 않는다 */}
      <Html position={[0, 0.25 * s.scale, 0.95 * s.scale]} center zIndexRange={[100, 0]} distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap [text-shadow:0_0_6px_#000]">
          <div className="text-xs font-semibold text-ink-200">{statueCaption(s)}</div>
          <div className="text-[10px]" style={{ color: s.color }}>
            {lanternCountLabel(count)}
          </div>
        </div>
      </Html>
    </group>
  );
}
