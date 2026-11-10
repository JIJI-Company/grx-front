// B2 상현의 방: 다다미 방, 가운데 통로 끝 해치. 벽·천장의 상자 방은 배경.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlacedStatue } from '../../../castle/floors';
import { BoxField, Embers, rng, scatter, useWindowTexture } from './sceneParts';

export default function SceneB2({ statues }: { statues: PlacedStatue[] }) {
  const boxes = useMemo(
    () =>
      scatter(
        2200,
        22,
        (r) => {
          const s = 3 + r() * 3;
          const x = (r() - 0.5) * 170;
          const y = -15 + r() * 90;
          const z = -110 + r() * 160;
          const inRoom = Math.abs(x) < 23 && z > -44 && z < 10 && y < 22;
          return inRoom ? null : { x, y, z, sx: s, sy: s, sz: s };
        },
        true,
      ),
    [],
  );
  return (
    <group>
      <ambientLight intensity={0.25} color="#ffcf90" />
      <hemisphereLight args={['#ffcc80', '#100802', 0.4]} />
      {/* 다다미 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -17]}>
        <planeGeometry args={[40, 46]} />
        <meshStandardMaterial color="#4e3f22" roughness={0.95} />
      </mesh>
      <gridHelper args={[44, 22, '#20180a', '#20180a']} position={[0, 0.01, -17]} />
      {/* 가운데 통로 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -15]}>
        <planeGeometry args={[3.2, 38]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* 해치 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -33]}>
        <planeGeometry args={[3.2, 6]} />
        <meshStandardMaterial color="#1a0406" roughness={0.6} />
      </mesh>
      {[
        [0, -30, 3.3, 0.08],
        [0, -36, 3.3, 0.08],
        [-1.6, -33, 0.08, 6],
        [1.6, -33, 0.08, 6],
        [0, -33, 0.06, 6],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.04, z]}>
          <boxGeometry args={[w, 0.02, d]} />
          <meshBasicMaterial color="#ff2a2a" />
        </mesh>
      ))}
      <pointLight position={[0, 1, -33]} color="#ff2020" intensity={12} distance={8} />
      <pointLight position={[0, 12, -17]} color="#ffb060" intensity={60} distance={45} />
      <BoxField boxes={boxes} />
      <Pillars />
      <HangingLanterns />
      <Banners statues={statues} />
      <DriftingRooms />
      <Embers count={300} seed={202} bounds={[-18, 18, 0, 10, -40, 6]} color="#ffb060" size={0.07} rise={0.12} opacity={0.6} />
    </group>
  );
}

// 통로 양옆 붉은 옻칠 기둥. 석상(z -8/-16/-24) 사이에 둬서 시선을 가리지 않게
function Pillars() {
  const zs = [-4, -12, -20, -28];
  return (
    <group>
      {zs.flatMap((z) =>
        [-5.6, 5.6].map((x) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 4.5, 0]}>
              <cylinderGeometry args={[0.34, 0.4, 9, 16]} />
              <meshStandardMaterial color="#7d1712" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[1, 0.3, 1]} />
              <meshStandardMaterial color="#1a0f08" />
            </mesh>
            <mesh position={[0, 9.05, 0]}>
              <boxGeometry args={[1, 0.18, 1]} />
              <meshStandardMaterial color="#b8860b" emissive="#b8860b" emissiveIntensity={0.35} />
            </mesh>
          </group>
        )),
      )}
      {[-5.6, 5.6].map((x) => (
        <mesh key={x} position={[x, 9.3, -16]}>
          <boxGeometry args={[0.5, 0.4, 25]} />
          <meshStandardMaterial color="#3a0d0a" />
        </mesh>
      ))}
    </group>
  );
}

// 통로 위에 매달린 큰 등롱 (흔들림)
function HangingLanterns() {
  const zs = [-3, -9, -15, -21, -27];
  const refs = useRef<THREE.Group[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((g, i) => g && (g.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i) * 0.05));
  });
  return (
    <group>
      {zs.map((z, i) => (
        <group key={z} position={[0, 9.3, z]} ref={(g) => g && (refs.current[i] = g)}>
          <mesh position={[0, -1, 0]}>
            <boxGeometry args={[0.03, 2, 0.03]} />
            <meshBasicMaterial color="#120806" />
          </mesh>
          <mesh position={[0, -2.6, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 1.2, 16]} />
            <meshStandardMaterial color="#ffb060" emissive="#ff9030" emissiveIntensity={1.6} />
          </mesh>
          {[-3.2, -2].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.08, 16]} />
              <meshStandardMaterial color="#1a0a06" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// 석상 뒤 멤버 색 깃발
function Banners({ statues }: { statues: PlacedStatue[] }) {
  return (
    <group>
      {statues.map((st) => {
        const side = Math.sign(st.x);
        return (
          <group key={st.memberId} position={[st.x + side * 3, 0, st.z]} rotation={[0, -side * (Math.PI / 2), 0]}>
            <mesh position={[0, 5.4, 0]}>
              <planeGeometry args={[2.6, 8]} />
              <meshStandardMaterial color={st.color} emissive={st.color} emissiveIntensity={0.18} side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
            <mesh position={[0, 9.5, 0]}>
              <boxGeometry args={[3.2, 0.16, 0.16]} />
              <meshStandardMaterial color="#b8860b" emissive="#b8860b" emissiveIntensity={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 벽 쪽 방들이 천천히 오르내림 (무한성이 움직이는 느낌)
function DriftingRooms() {
  const tex = useWindowTexture();
  const items = useMemo(() => {
    const r = rng(55);
    return Array.from({ length: 48 }, () => {
      const side = r() < 0.5 ? -1 : 1;
      return { x: side * (24 + r() * 10), y: 3 + r() * 20, z: -42 + r() * 50, s: 3 + r() * 3, ph: r() * 6.28, sp: 0.15 + r() * 0.2, b: 0.4 + r() * 0.7 };
    });
  }, []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: tex }), items.length);
    const col = new THREE.Color();
    items.forEach((it, i) => m.setColorAt(i, col.setScalar(it.b)));
    m.frustumCulled = false;
    return m;
  }, [items, tex]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    items.forEach((it, i) => {
      o.position.set(it.x, it.y + Math.sin(t * it.sp + it.ph) * 4, it.z);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}
