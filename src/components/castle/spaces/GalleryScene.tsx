// Content 화랑 내부: 크루의 콘텐츠 포스터를 족자처럼 건 회랑.
//   어두운 나무 바닥 → 가운데 칸막이로 나뉜 두 통로 → 벽·칸막이 네 면에 족자(금 봉 + 비단 테두리 + 포스터)
//   → 족자마다 위에서 비추는 작은 등 → 맨 안쪽 현판. 새 콘텐츠가 입구 쪽.
// 가까이 가면 그 족자의 테두리가 금빛으로 바뀌고, 화면 아래 안내(E 크게 보기)는 CastleGame이 띄운다.
// 포스터 이미지는 가까운 것만 불러온다(장당 수백 KB).
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { ContentsArchiveItem } from '../../../api/types';
import { canvasTexture, Embers, useWindowTexture } from '../floors/sceneParts';
import { galleryEndZ, lastColumnZ, nearestPoster, placePosters, SPINE_HALF, WALL_X, type PlacedPoster } from './galleryPresentation';
import { ExitMarker, GlowPool, Label, PaperLantern, Signboard } from './parts';

export const GALLERY_FOG = { color: '#0e0908', density: 0.014 };

const HALF_W = WALL_X + 0.3;
const CEILING = 6.2;
const ENTRANCE_Z = 8;
/** 칸막이 앞 끝: 입구까지 */
const SPINE_FRONT = 7.6;
/** 포스터(2:3)와 족자 크기(m) */
const POSTER = { w: 1.06, h: 1.59 };
const SCROLL = { w: 1.3, h: 2.05, y: 2.35 };
/** 가까이 판정(m)과 사진을 불러오는 거리 */
const NEAR_RADIUS = 2.4;
const PHOTO_RADIUS = 14;

function Poster({ url }: { url: string }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const image = tex.image as { width: number; height: number };
  // 2:3보다 넓거나 좁으면 가운데를 잘라 채운다
  const ratio = image.width / image.height / (POSTER.w / POSTER.h);
  tex.repeat.set(ratio > 1 ? 1 / ratio : 1, ratio > 1 ? 1 : ratio);
  tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
  return (
    <mesh position={[0, 0.05, 0.022]}>
      <planeGeometry args={[POSTER.w, POSTER.h]} />
      <meshBasicMaterial map={tex} color="#e6dcd2" toneMapped={false} />
    </mesh>
  );
}

const SILK = ['#5a1414', '#14243f', '#2e1d3f', '#123327'];

/** 족자 한 폭: 위 봉(금 마개) + 비단 테두리 + 포스터 + 아래 봉, 위에 끈과 작은 등. 앞 = +z */
function Scroll({ poster, index, active, showImage }: { poster: PlacedPoster; index: number; active: boolean; showImage: boolean }) {
  return (
    <group position={[poster.x, 0, poster.z]} rotation={[0, poster.rotY, 0]}>
      <group position={[0, SCROLL.y, 0.04]}>
        {/* 비단 테두리 */}
        <mesh>
          <boxGeometry args={[SCROLL.w, SCROLL.h, 0.02]} />
          <meshStandardMaterial color={SILK[index % SILK.length]} roughness={0.75} emissive={active ? '#d4a020' : '#000000'} emissiveIntensity={active ? 0.25 : 0} />
        </mesh>
        {/* 포스터 자리 (불러오기 전에는 어두운 종이) */}
        <mesh position={[0, 0.05, 0.012]}>
          <planeGeometry args={[POSTER.w + 0.04, POSTER.h + 0.04]} />
          <meshStandardMaterial color={active ? '#e9c46a' : '#2a2320'} emissive={active ? '#d4a020' : '#000000'} emissiveIntensity={active ? 0.6 : 0} />
        </mesh>
        {showImage && poster.item.imageUrl && (
          <Suspense fallback={null}>
            <Poster url={poster.item.imageUrl} />
          </Suspense>
        )}
        {/* 위·아래 봉과 금 마개 */}
        {[SCROLL.h / 2 + 0.03, -SCROLL.h / 2 - 0.04].map((y, k) => (
          <group key={y} position={[0, y, 0.02]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[k ? 0.035 : 0.028, k ? 0.035 : 0.028, SCROLL.w + 0.12, 10]} />
              <meshStandardMaterial color="#2a1a12" roughness={0.6} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (SCROLL.w / 2 + 0.08), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.045, 0.045, 0.06, 10]} />
                <meshStandardMaterial color="#c9971f" emissive="#6a4a08" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
        {/* 걸이 끈 */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.32, SCROLL.h / 2 + 0.3, 0.01]} rotation={[0, 0, s * 0.55]}>
            <boxGeometry args={[0.012, 0.62, 0.012]} />
            <meshStandardMaterial color="#8a6a3a" />
          </mesh>
        ))}
      </group>
      {/* 족자를 비추는 작은 등 (벽에서 앞으로 나온 팔 끝) */}
      <PaperLantern position={[0, SCROLL.y + SCROLL.h / 2 + 0.75, 0.55]} size={0.45} color="#ffd9a0" glow={active ? 3 : 2.2} />
      <GlowPool position={[0, 0.03, 1.1]} size={2.4} color="#ffcf8a" opacity={active ? 0.35 : 0.16} />
    </group>
  );
}

interface GallerySceneProps {
  items: ContentsArchiveItem[];
  low: boolean;
  /** "가까이"의 기준 위치(m). 게임에서는 내 캐릭터, 없으면 카메라 */
  focus?: { x: number; z: number };
  /** 가까이 간 포스터가 바뀌면 (없으면 null) */
  onNear?: (item: ContentsArchiveItem | null) => void;
}

export default function GalleryScene({ items, low, focus, onNear }: GallerySceneProps) {
  const posters = useMemo(() => placePosters(items), [items]);
  const endZ = galleryEndZ(items.length);
  const spineEnd = lastColumnZ(items.length) - 1.3;
  const length = ENTRANCE_Z - endZ;
  const zc = (ENTRANCE_Z + endZ) / 2;
  const [nearId, setNearId] = useState<string | null>(null);
  const [photoIds, setPhotoIds] = useState<ReadonlySet<string>>(() => new Set());
  const lastNear = useRef<string | null>(null);
  useFrame(({ camera }) => {
    const at = focus ?? { x: camera.position.x, z: camera.position.z };
    const near = nearestPoster(posters, at.x, at.z, NEAR_RADIUS);
    const id = near?.item.id ?? null;
    if (id !== lastNear.current) {
      lastNear.current = id;
      setNearId(id);
      onNear?.(near?.item ?? null);
    }
    const fresh = posters.filter((p) => !photoIds.has(p.item.id) && Math.hypot(p.viewX - at.x, p.z - at.z) < PHOTO_RADIUS);
    if (fresh.length) setPhotoIds(new Set([...photoIds, ...fresh.map((p) => p.item.id)]));
  });
  useEffect(() => () => onNear?.(null), [onNear]);

  const floor = useMemo(
    () =>
      canvasTexture(
        256,
        (g, n) => {
          for (let i = 0; i < 8; i++) {
            const v = 22 + ((i * 37) % 9);
            g.fillStyle = `rgb(${v + 14},${v + 6},${v})`;
            g.fillRect(0, (i * n) / 8, n, n / 8 - 2);
          }
          g.fillStyle = 'rgba(0,0,0,0.5)';
          for (let i = 0; i < 8; i++) g.fillRect(((i * 97) % n), (i * n) / 8, 2, n / 8);
        },
        [HALF_W / 2, length / 3],
      ),
    [length],
  );
  const shoji = useWindowTexture(1);
  const wallShoji = useMemo(() => {
    const t = shoji.clone();
    t.repeat.set(length / 2.2, 1);
    t.needsUpdate = true;
    return t;
  }, [shoji, length]);
  const lanternZ = useMemo(() => Array.from({ length: Math.max(1, Math.floor((ENTRANCE_Z - 1 - endZ) / 4.4)) }, (_, i) => 3 - i * 4.4), [endZ]);

  return (
    <group>
      <ambientLight intensity={0.22} color="#ffd9b0" />
      <hemisphereLight args={['#ffd2a0', '#140a06', 0.3]} />
      {/* 바닥·천장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]}>
        <planeGeometry args={[HALF_W * 2, length]} />
        <meshStandardMaterial map={floor} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, CEILING + 0.2, zc]}>
        <boxGeometry args={[HALF_W * 2, 0.4, length]} />
        <meshStandardMaterial color="#120c0a" roughness={0.9} />
      </mesh>
      {/* 양쪽 벽: 아래는 어두운 나무, 위는 은은한 장지 띠 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * HALF_W, 0, zc]}>
          <mesh position={[0, CEILING / 2, 0]}>
            <boxGeometry args={[0.3, CEILING, length]} />
            <meshStandardMaterial color="#1e1410" roughness={0.85} />
          </mesh>
          <mesh position={[-s * 0.16, CEILING - 0.6, 0]} rotation={[0, -s * Math.PI / 2, 0]}>
            <planeGeometry args={[length, 0.8]} />
            <meshBasicMaterial map={wallShoji} color="#6a4a30" />
          </mesh>
        </group>
      ))}
      {/* 가운데 칸막이: 검은 옻칠 판 + 금 테. 입구까지 이어져 들어가는 통로·나오는 통로를 나눈다 */}
      <group position={[0, 0, (SPINE_FRONT + spineEnd) / 2]}>
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[SPINE_HALF * 2 - 0.04, 4.6, SPINE_FRONT - spineEnd]} />
          <meshStandardMaterial color="#17100e" roughness={0.4} metalness={0.15} />
        </mesh>
        <mesh position={[0, 4.62, 0]}>
          <boxGeometry args={[SPINE_HALF * 2 + 0.06, 0.06, SPINE_FRONT - spineEnd + 0.06]} />
          <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.4} />
        </mesh>
      </group>
      {/* 맨 안쪽 벽과 현판 */}
      <mesh position={[0, CEILING / 2, endZ - 0.15]}>
        <boxGeometry args={[HALF_W * 2, CEILING, 0.3]} />
        <meshStandardMaterial color="#1e1410" roughness={0.85} />
      </mesh>
      <Signboard text={`화랑 · ${items.length}`} width={3.6} height={0.95} position={[0, 4.1, endZ + 0.1]} />
      <Label text="CONTENT ARCHIVE" width={3.6} height={0.34} color="#c9a04a" glow={1.3} position={[0, 3.25, endZ + 0.1]} />
      {/* 통로 위 종이등 */}
      {lanternZ.flatMap((z) =>
        [-1, 1].map((s) => (
          <group key={`${s}${z}`} position={[s * 2.9, 0, z]}>
            <PaperLantern position={[0, CEILING - 1.1, 0]} size={1.1} glow={1.9} />
            {!low && <pointLight position={[0, CEILING - 1.6, 0]} color="#ffc488" intensity={16} distance={9} decay={1.6} />}
          </group>
        )),
      )}
      {posters.map((p, i) => (
        <Scroll key={p.item.id} poster={p} index={i} active={p.item.id === nearId} showImage={photoIds.has(p.item.id)} />
      ))}
      {/* 입구·출구: 통로마다 걸린 현판, 출구 바닥에는 금빛 표시 */}
      <Signboard text="입구 · 예전부터" width={2.6} height={0.6} position={[-2.9, 4.6, 6.6]} />
      <Signboard text="출구 · 최신까지" width={2.6} height={0.6} position={[2.9, 4.6, 6.6]} />
      <ExitMarker x={2.9} z={7.2} width={3.6} />
      <Embers count={low ? 60 : 150} seed={81} bounds={[-5, 5, 0, 5.5, endZ, 7]} color="#ffcf9a" size={0.05} rise={0.08} opacity={0.5} />
    </group>
  );
}
