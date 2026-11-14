// B1 하현의 회랑: 장지문 벽·단청 천장 보·걸린 초롱이 늘어선 복도 → 발코니 → 계단 5칸.
// 입구(z 2) 뒤로도 복도가 안개 속으로 끝없이 이어져 보인다 (걷기 영역은 floors.ts 그대로). 발코니 너머 무한 공간은 배경.
import { useMemo } from 'react';
import * as THREE from 'three';
import { BoxField, canvasTexture, Embers, Instanced, scatter, type Placement } from './sceneParts';

/** 보이는 복도: z 2(입구)에서 뒤로 안개 속까지, 앞은 발코니(-40)까지 */
const HALL_BACK = 90;
const HALL_FRONT = -40.5;
const HALL_LEN = HALL_BACK - HALL_FRONT;
const HALL_MID = (HALL_BACK + HALL_FRONT) / 2;
const BEAM_STEP = 2.5;
const BEAMS = Array.from({ length: Math.floor((HALL_BACK + 40) / BEAM_STEP) }, (_, i) => HALL_BACK - BEAM_STEP - i * BEAM_STEP); // … 0, -2.5, …, -40
// 난간 기둥: z 1.2 ~ -39.6. 가로대도 정확히 이 구간만
const POSTS = Array.from({ length: 35 }, (_, i) => 1.2 - i * 1.2);
/** 걸린 초롱: 난간 바로 위 양옆, 5m 간격 */
const CHOCHIN = Array.from({ length: Math.floor((HALL_BACK + 38) / 5) }, (_, i) => HALL_BACK - 3 - i * 5);
const CHOCHIN_X = 2.05;
const CHOCHIN_Y = 4.1;

/** 장지문: 등불이 비치는 종이 칸 + 가는 나무 살, 아래 25%는 나무 판. 한 장 = 폭 3m */
function shojiTexture(repeat: number) {
  return canvasTexture(
    256,
    (g, n) => {
      g.fillStyle = '#e8cfa0';
      g.fillRect(0, 0, n, n);
      const glow = g.createRadialGradient(n / 2, n * 0.4, 0, n / 2, n * 0.4, n * 0.7);
      glow.addColorStop(0, 'rgba(255,190,110,0.5)');
      glow.addColorStop(1, 'rgba(90,40,10,0.45)');
      g.fillStyle = glow;
      g.fillRect(0, 0, n, n);
      g.fillStyle = '#2a150a'; // 살
      for (let k = 0; k <= 6; k++) g.fillRect((k * n) / 6 - 2, 0, 4, n * 0.75);
      for (let k = 0; k <= 8; k++) g.fillRect(0, (k * n * 0.75) / 8 - 2, n, 4);
      g.fillStyle = '#1c0e06'; // 아래 나무 판 + 문틀
      g.fillRect(0, n * 0.75, n, n * 0.25);
      g.fillRect(0, 0, 8, n);
      g.fillRect(n - 8, 0, 8, n);
    },
    [repeat, 1],
  );
}

export default function SceneB1() {
  const voidBoxes = useMemo(
    () =>
      scatter(1100, 11, (r) => {
        const s = 3 + r() * 6;
        return { x: (r() - 0.5) * 200, y: -70 + r() * 110, z: -58 - r() * 200, sx: s * (1 + r()), sy: s * 0.7, sz: s };
      }),
    [],
  );
  const shoji = useMemo(() => {
    const tex = shojiTexture(HALL_LEN / 3);
    // 양쪽 벽 전체가 빛나는 면이라 세면 눈이 피로하다(2026-11-14 B2 기준에 맞춰 낮춤). 종이 결이 보일 만큼만 은은하게
    return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffb070', emissiveIntensity: 0.14, roughness: 0.9 });
  }, []);
  return (
    <group>
      <hemisphereLight args={['#7a5a40', '#100605', 0.6]} />
      <ambientLight intensity={0.25} />
      {/* 복도 바닥은 z HALL_BACK ~ -40. 발코니 바닥(-40 ~ -48)과 겹치면 깜빡이므로 딱 맞춘다 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (HALL_BACK - 40) / 2]}>
        <planeGeometry args={[3.8, HALL_BACK + 40]} />
        {/* 밝은 돌색이면 석상 빛이 하얗게 번져 눈부시다 → 한 톤 어둡게 */}
        <meshStandardMaterial color="#544d43" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, (HALL_BACK - 40) / 2]}>
        <planeGeometry args={[12.4, HALL_BACK + 40]} />
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
          {/* 장지문 벽 (뒤판 + 안쪽 종이면) */}
          <mesh position={[side * 6.2, 3, HALL_MID]}>
            <boxGeometry args={[0.3, 6, HALL_LEN]} />
            <meshStandardMaterial color="#24120a" roughness={0.9} />
          </mesh>
          <mesh position={[side * 6.04, 3, HALL_MID]} rotation={[0, -side * (Math.PI / 2), 0]} material={shoji}>
            <planeGeometry args={[HALL_LEN, 6]} />
          </mesh>
        </group>
      ))}
      <RailPosts />
      {/* 단청 천장 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6.2, HALL_MID]}>
        <planeGeometry args={[12.4, HALL_LEN]} />
        <meshStandardMaterial color="#173a37" roughness={0.9} />
      </mesh>
      <CeilingBeams />
      <Chochin />
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

// 난간 살: 양옆 70개 = draw call 1번
function RailPosts() {
  const items = useMemo(() => [-1, 1].flatMap((side) => POSTS.map((z): Placement => ({ p: [side * 2.05, 0.5, z] }))), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.07, 1, 0.07), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9c2219', roughness: 0.6 }), []);
  return <Instanced geometry={geometry} material={material} items={items} />;
}

// 천장 보: 청록 두 색을 번갈아(인스턴스 색) + 붉은 띠. draw call 2번
function CeilingBeams() {
  const beams = useMemo(() => BEAMS.map((z, i): Placement => ({ p: [0, 5.8, z], c: i % 2 ? '#2f7a6d' : '#3d8c62' })), []);
  const strips = useMemo(() => BEAMS.map((z): Placement => ({ p: [0, 5.6, z] })), []);
  const g = useMemo(() => ({ beam: new THREE.BoxGeometry(12.4, 0.35, 0.5), strip: new THREE.BoxGeometry(12.4, 0.06, 0.52) }), []);
  const m = useMemo(
    () => ({ beam: new THREE.MeshStandardMaterial({ roughness: 0.7 }), strip: new THREE.MeshStandardMaterial({ color: '#a8322b', roughness: 0.7 }) }),
    [],
  );
  return (
    <>
      <Instanced geometry={g.beam} material={m.beam} items={beams} />
      <Instanced geometry={g.strip} material={m.strip} items={strips} />
    </>
  );
}

// 걸린 초롱: 붉은 종이 몸통(발광) + 검은 위아래 테 + 매단 줄. 광원 없이 블룸으로만. draw call 3번
function Chochin() {
  const items = useMemo(() => {
    const at = CHOCHIN.flatMap((z) => [-CHOCHIN_X, CHOCHIN_X].map((x) => [x, z] as const));
    return {
      body: at.map(([x, z]): Placement => ({ p: [x, CHOCHIN_Y, z], s: [1, 1.3, 1] })),
      rims: at.flatMap(([x, z]): Placement[] => [{ p: [x, CHOCHIN_Y + 0.36, z] }, { p: [x, CHOCHIN_Y - 0.36, z] }]),
      cords: at.map(([x, z]): Placement => ({ p: [x, (CHOCHIN_Y + 5.6) / 2 + 0.2, z], s: [1, 5.6 - CHOCHIN_Y - 0.4, 1] })),
    };
  }, []);
  const g = useMemo(
    () => ({ body: new THREE.SphereGeometry(0.3, 16, 12), rim: new THREE.CylinderGeometry(0.17, 0.17, 0.07, 12), cord: new THREE.BoxGeometry(0.02, 1, 0.02) }),
    [],
  );
  const m = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: '#d8492c', emissive: '#ff5a24', emissiveIntensity: 0.85, roughness: 0.8 }),
      rim: new THREE.MeshStandardMaterial({ color: '#120806' }),
      cord: new THREE.MeshBasicMaterial({ color: '#120806' }),
    }),
    [],
  );
  return (
    <>
      <Instanced geometry={g.body} material={m.body} items={items.body} />
      <Instanced geometry={g.rim} material={m.rim} items={items.rims} />
      <Instanced geometry={g.cord} material={m.cord} items={items.cords} />
    </>
  );
}
