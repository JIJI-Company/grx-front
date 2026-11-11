// B3 심층: 수직 허공에 떠 있는 거울 단 + 다리. 단 둘레에 패배한 검사 전시, 붉은 균열·탑 불빛·뒤집힌 방 조각은 배경.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import { DefeatedSwordsmen, FloatingFragments } from './B3Exhibit';
import { BoxField, Embers, scatter } from './sceneParts';

const MARK_URL = '/castle/mark.webp'; // 꾸한성 마크(붉은 달 + 먹). 달 중심이 이미지 중심
const MARK_SIZE = 17; // 달 지름 ≈ 7.6m

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

export default function SceneB3({ low }: { low: boolean }) {
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
  const mark = useTexture(MARK_URL);
  mark.colorSpace = THREE.SRGBColorSpace;
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

      {/* 거울 바닥: 단과 그 둘레 허공을 반사면 하나로 (가장자리로 갈수록 투명) */}
      <MirrorFloor low={low} />
      <DefeatedSwordsmen />
      <FloatingFragments />
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
      {/* 석상 뒤에서 천천히 도는 꾸한성 마크 */}
      <group ref={halo} position={[0, 12.9, -8.9]}>
        <mesh>
          <planeGeometry args={[MARK_SIZE, MARK_SIZE]} />
          <meshBasicMaterial map={mark} transparent depthWrite={false} />
        </mesh>
      </group>
      {/* 석상을 관통하는 빛기둥 */}
      <mesh position={[0, 0, -7]}>
        <cylinderGeometry args={[3, 3, 400, 32, 1, true]} />
        <meshBasicMaterial color="#ffb040" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* 떠오르는 불티와 떠다니는 먼지: Points 1개 */}
      <Embers count={low ? 260 : 700} seed={77} bounds={[-45, 45, -50, 60, -60, 20]} color="#ff7a30" altColor="#8a7f86" size={0.28} rise={1.2} />
      {/* 출구 표시 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 15.5]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
    </group>
  );
}

const MIRROR_RADIUS = 42;
const PLATFORM_RADIUS = 8.5;

/** 거울 바닥 알파: 단(반지름 8.5)은 진하게, 바깥 허공으로 갈수록 옅어진다 */
function useMirrorFade() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const k = PLATFORM_RADIUS / MIRROR_RADIUS;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(k * 0.97, '#fff');
    grad.addColorStop(k * 1.03, '#777');
    grad.addColorStop(0.55, '#2a2a2a');
    grad.addColorStop(1, '#000');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** 석상·등롱·사람이 거꾸로 비친다. 반사는 장면을 한 번 더 그리므로 저해상도 + blur, 저사양은 광택 재질로 대신 */
function MirrorFloor({ low }: { low: boolean }) {
  const fade = useMirrorFade();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1.5]} renderOrder={-1}>
      <circleGeometry args={[MIRROR_RADIUS, 96]} />
      {low ? (
        <meshStandardMaterial color="#3a1d24" roughness={0.18} metalness={0.75} alphaMap={fade} transparent depthWrite={false} />
      ) : (
        <MeshReflectorMaterial
          mirror={0.9}
          resolution={512}
          blur={[160, 60]}
          mixBlur={0.5}
          mixStrength={9}
          mixContrast={1.1}
          color="#6a4a52"
          roughness={0.3}
          metalness={0.35}
          alphaMap={fade}
          transparent
          depthWrite={false}
        />
      )}
    </mesh>
  );
}

useTexture.preload(MARK_URL);
