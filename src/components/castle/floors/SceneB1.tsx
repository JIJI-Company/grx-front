// B1 하현의 회랑: 단청 천장 복도 → 발코니 → 계단 5칸. 발코니 너머 무한 공간은 배경.
import { useMemo } from 'react';
import { BoxField, Embers, scatter } from './sceneParts';

const BEAMS = Array.from({ length: 17 }, (_, i) => -i * 2.5);
// 난간 기둥: z 1.2 ~ -39.6. 가로대도 정확히 이 구간만
const POSTS = Array.from({ length: 35 }, (_, i) => 1.2 - i * 1.2);

export default function SceneB1() {
  const voidBoxes = useMemo(
    () =>
      scatter(1100, 11, (r) => {
        const s = 3 + r() * 6;
        return { x: (r() - 0.5) * 200, y: -70 + r() * 110, z: -58 - r() * 200, sx: s * (1 + r()), sy: s * 0.7, sz: s };
      }),
    [],
  );
  return (
    <group>
      <hemisphereLight args={['#7a5a40', '#100605', 1.1]} />
      <ambientLight intensity={0.25} />
      {/* 복도 바닥은 z 2 ~ -40. 발코니 바닥(-40 ~ -48)과 겹치면 깜빡이므로 딱 맞춘다 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -19]}>
        <planeGeometry args={[3.8, 42]} />
        <meshStandardMaterial color="#8d8576" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -19]}>
        <planeGeometry args={[12.4, 42]} />
        <meshStandardMaterial color="#2b170e" roughness={0.9} />
      </mesh>
      {/* 붉은 난간 */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 2.05, 1, -19.2]}>
            <boxGeometry args={[0.1, 0.1, 40.8]} />
            <meshStandardMaterial color="#b3261e" roughness={0.6} />
          </mesh>
          {[1.2, -39.6].map((z) => (
            <group key={z} position={[side * 2.05, 0, z]}>
              <mesh position={[0, 0.58, 0]}>
                <boxGeometry args={[0.18, 1.16, 0.18]} />
                <meshStandardMaterial color="#8f1d16" roughness={0.6} />
              </mesh>
              <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[0.24, 0.08, 0.24]} />
                <meshStandardMaterial color="#b8860b" emissive="#b8860b" emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
          {POSTS.map((z) => (
            <mesh key={z} position={[side * 2.05, 0.5, z]}>
              <boxGeometry args={[0.07, 1, 0.07]} />
              <meshStandardMaterial color="#9c2219" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[side * 6.2, 3, -19]}>
            <boxGeometry args={[0.3, 6, 44]} />
            <meshStandardMaterial color="#24120a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* 단청 천장 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.2, -19]}>
        <planeGeometry args={[12.4, 44]} />
        <meshStandardMaterial color="#173a37" roughness={0.9} />
      </mesh>
      {BEAMS.map((z, i) => (
        <group key={z} position={[0, 5.8, z]}>
          <mesh>
            <boxGeometry args={[12.4, 0.35, 0.5]} />
            <meshStandardMaterial color={i % 2 ? '#2f7a6d' : '#3d8c62'} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[12.4, 0.06, 0.52]} />
            <meshStandardMaterial color="#a8322b" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 복도 끝 발코니 + 계단 5칸 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -44]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#5a3218" roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 3.9, 0.9, -47.9]}>
            <boxGeometry args={[4.2, 0.08, 0.08]} />
            <meshStandardMaterial color="#6a3a1c" />
          </mesh>
          <mesh position={[side * 5.95, 0.9, -44]}>
            <boxGeometry args={[0.08, 0.08, 8]} />
            <meshStandardMaterial color="#6a3a1c" />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, -0.2 - i * 0.4, -48.5 - i]}>
          <boxGeometry args={[3.2, 0.4, 1]} />
          <meshStandardMaterial color="#4a2810" roughness={0.7} />
        </mesh>
      ))}
      <pointLight position={[0, 3, -44]} color="#ffb060" intensity={30} distance={18} />
      {/* 발코니 너머 무한 공간 (배경) */}
      <BoxField boxes={voidBoxes} />
      <mesh position={[0, -10, -240]}>
        <planeGeometry args={[600, 300]} />
        <meshBasicMaterial color="#3a1a08" />
      </mesh>
      {/* 복도에 떠도는 금빛 먼지 */}
      <Embers count={220} seed={101} bounds={[-5, 5, 0, 5.5, -46, 3]} color="#ffcf80" size={0.05} rise={0.08} opacity={0.7} />
    </group>
  );
}
