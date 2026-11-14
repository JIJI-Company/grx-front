// 종목별 트로피 (public/castle/trophies.glb, Blender 원본: 저장소 밖 assets/castle/trophies.blend · trophies.py).
// 종목 트로피 9종(trophy_{slug})과 전당 맨 안쪽의 대표 트로피(trophy_grand)가 들어 있다. 금속 재질(tr_metal)만 메달 색으로 바꾸고 받침 재질(tr_dark)은 그대로 둔다.
// 높이 약 1m, 원점 = 바닥 가운데. 실제 게임의 로고·공식 트로피를 본뜨지 않은 일반 사물이다.
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Medal, Vec3 } from './parts';

const URL = '/castle/trophies.glb';

/** Notion 종목 이름 → 모델. 목록에 없는 종목은 '기타' 모델 */
const MODEL_BY_CATEGORY: Record<string, string> = {
  롤: 'lol',
  배그: 'pubg',
  마인크래프트: 'minecraft',
  오버워치: 'overwatch',
  발로란트: 'valorant',
  멀티: 'multi',
  기타: 'etc',
  피파: 'fifa',
  러스트: 'rust',
};

const MEDAL_METAL: Record<Medal, { color: string; emissive: string }> = {
  gold: { color: '#d9a520', emissive: '#7a5208' },
  silver: { color: '#c9ced6', emissive: '#3a4250' },
  bronze: { color: '#b0703a', emissive: '#4a2408' },
};

/** 메달별 금속 재질 (모든 트로피가 같이 쓴다) */
const METALS = Object.fromEntries(
  Object.entries(MEDAL_METAL).map(([medal, m]) => [
    medal,
    new THREE.MeshStandardMaterial({ color: m.color, emissive: m.emissive, emissiveIntensity: 0.6, metalness: 0.55, roughness: 0.3 }),
  ]),
) as Record<Medal, THREE.MeshStandardMaterial>;

export function trophyModelOf(category: string): string {
  return MODEL_BY_CATEGORY[category.trim()] ?? 'etc';
}

/** 재질이 둘이라 GLTF에서는 트로피 하나가 그룹(메시 2개)으로 들어온다. 메시 하나여도 같은 목록으로 다룬다 */
function partsOf(node: THREE.Object3D | undefined): THREE.Mesh[] {
  if (!node) return [];
  if ((node as THREE.Mesh).isMesh) return [node as THREE.Mesh];
  return node.children.filter((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh);
}

export default function GameTrophy({ category, medal, position, scale = 1 }: { category: string; medal: Medal; position?: Vec3; scale?: number }) {
  const { nodes } = useGLTF(URL);
  const node = nodes[`trophy_${trophyModelOf(category)}`];
  // 금속 재질만 메달 재질로 바꾼다 (지오메트리는 공유)
  const parts = useMemo(
    () =>
      partsOf(node).map((m) => {
        const mat = m.material as THREE.Material;
        return { geometry: m.geometry, material: mat.name.startsWith('tr_metal') ? METALS[medal] : mat };
      }),
    [node, medal],
  );
  return (
    <group position={position} scale={scale}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} />
      ))}
    </group>
  );
}

/** 꾸한성 붉은 달 구슬: 블룸에 잡히게 1을 넘는 색 */
const MOON = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2410').multiplyScalar(1.5) });
/** 대표 트로피 금: 종목 트로피보다 자체 발광을 낮춰 칼날·고리 같은 세부가 빛에 묻히지 않게 */
const GRAND_GOLD = new THREE.MeshStandardMaterial({ color: '#d9a520', emissive: '#5a3a06', emissiveIntensity: 0.5, metalness: 0.75, roughness: 0.22 });

/** 크리스털 기둥: 붉은 기가 도는 투명 유리 (실시간 굴절 대신 반투명 + 은은한 자체 발광) */
const GLASS = new THREE.MeshPhysicalMaterial({
  color: '#ffb0a0',
  emissive: '#ff3a1a',
  emissiveIntensity: 0.35,
  roughness: 0.05,
  metalness: 0,
  transparent: true,
  opacity: 0.45,
  depthWrite: false,
});

/** 전당 맨 안쪽의 대표 트로피 "붉은 달의 첨탑": 팔각 흑석 받침·월계 고리·크리스털 기둥·비틀린 금 칼날 4장·붉은 달 구슬·초승달 칼날·두 뿔. 높이 약 1.4m */
export function GrandTrophy({ position, scale = 1 }: { position?: Vec3; scale?: number }) {
  const { nodes } = useGLTF(URL);
  const node = nodes.trophy_grand;
  const parts = useMemo(
    () =>
      partsOf(node).map((m) => {
        const mat = m.material as THREE.Material;
        const material = mat.name.startsWith('tr_moon')
          ? MOON
          : mat.name.startsWith('tr_glass')
            ? GLASS
            : mat.name.startsWith('tr_metal')
              ? GRAND_GOLD
              : mat;
        return { geometry: m.geometry, material };
      }),
    [node],
  );
  return (
    <group position={position} scale={scale}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} />
      ))}
    </group>
  );
}

useGLTF.preload(URL);
