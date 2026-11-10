// B3 심층: 수직 허공에 떠 있는 투명한 단 + 다리. 붉은 균열과 탑 불빛은 배경.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoxField, Embers, scatter } from './sceneParts';

const FRAME: [number, number, number, number][] = [
  [0, 16.6, 9.6, 0.3],
  [-4.6, 9, 0.3, 15],
  [4.6, 9, 0.3, 15],
];
const RINGS: [number, number][] = [
  [2.4, 0.35],
  [5.2, 0.3],
  [8.5, 0.85],
];

export default function SceneB3() {
  const towers = useMemo(
    () =>
      scatter(900, 33, (r) => {
        const a = r() * Math.PI * 2;
        const rad = 55 + r() * 140;
        const w = 6 + r() * 12;
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad - 5;
        if (Math.abs(x) < 14 && z < -20) return null; // 균열 앞은 비워 둔다
        if (z > 5 && Math.abs(x) < 60) return null; // 카메라 쪽은 비워서 허공이 보이게
        return { x, y: -220 + r() * 440, z, sx: w, sy: 20 + r() * 50, sz: w };
      }),
    [],
  );
  const halo = useRef<THREE.Group>(null!);
  const throne = useRef<THREE.Group>(null!);
  useFrame(({ clock }, dt) => {
    const bob = Math.sin(clock.elapsedTime * 0.6) * 0.35;
    halo.current.rotation.z += dt * 0.08;
    halo.current.position.y = 12.9 + bob;
    throne.current.position.y = bob;
  });
  return (
    <group>
      <ambientLight intensity={0.22} color="#ff9a7a" />
      {/* 붉은 균열 */}
      <mesh position={[0, 0, -70]}>
        <planeGeometry args={[7, 800]} />
        <meshBasicMaterial color="#ff6a2a" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -72]}>
        <planeGeometry args={[60, 800]} />
        <meshBasicMaterial color="#a01208" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 6, -20]} color="#ff3a1a" intensity={80} distance={60} />
      {/* 위에서 내려오는 금빛 */}
      <pointLight position={[0, 24, -4]} color="#ffc860" intensity={70} distance={45} decay={1.6} />
      <BoxField boxes={towers} repeatY={6} dim={0.45} />

      {/* 투명한 단: 금빛 동심원만 보이게 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1.5]}>
        <circleGeometry args={[8.5, 72]} />
        <meshStandardMaterial color="#ffcf80" emissive="#ff9a40" emissiveIntensity={0.15} transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {RINGS.map(([r, o]) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]}>
          <ringGeometry args={[r - 0.05, r, 128]} />
          <meshBasicMaterial color="#ffcf60" transparent opacity={o} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* 단 아래로 번지는 빛 (떠 있다는 느낌) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -1.5]}>
        <circleGeometry args={[14, 48]} />
        <meshBasicMaterial color="#ff8a30" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* 투명한 다리 + 금빛 테두리 */}
      <mesh position={[0, -0.03, 12]}>
        <boxGeometry args={[2.8, 0.04, 12]} />
        <meshStandardMaterial color="#ffcf80" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.01, 12]}>
          <boxGeometry args={[0.05, 0.05, 12]} />
          <meshBasicMaterial color="#ffcf60" />
        </mesh>
      ))}

      {/* 떠 있는 왕좌 등판 */}
      <group ref={throne}>
        <mesh position={[0, 9, -10.2]}>
          <boxGeometry args={[9, 15, 1]} />
          <meshStandardMaterial color="#22050a" roughness={0.6} />
        </mesh>
        {FRAME.map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, -9.6]}>
            <boxGeometry args={[w, h, 0.3]} />
            <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
      {/* 후광 */}
      <group ref={halo} position={[0, 12.9, -8.9]}>
        <mesh>
          <torusGeometry args={[3.4, 0.09, 12, 96]} />
          <meshBasicMaterial color="#ffd060" />
        </mesh>
        <mesh>
          <torusGeometry args={[4.1, 0.03, 8, 96]} />
          <meshBasicMaterial color="#ffb040" transparent opacity={0.7} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a) * 3.75, Math.sin(a) * 3.75, 0]}>
              <boxGeometry args={[0.7, 0.06, 0.06]} />
              <meshBasicMaterial color="#ffd060" />
            </mesh>
          );
        })}
      </group>
      {/* 석상을 관통하는 빛기둥 */}
      <mesh position={[0, 0, -7]}>
        <cylinderGeometry args={[3, 3, 400, 32, 1, true]} />
        <meshBasicMaterial color="#ffb040" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* 떠오르는 불씨 */}
      <Embers count={700} seed={77} bounds={[-45, 45, -50, 60, -60, 20]} color="#ff7a30" size={0.28} rise={1.2} />
      {/* 출구 표시 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 15.5]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
    </group>
  );
}
