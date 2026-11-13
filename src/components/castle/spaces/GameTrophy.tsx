// 종목별 트로피 (public/castle/trophies.glb, Blender 원본: 저장소 밖 assets/castle/trophies.blend · trophies.py).
// 모델 9종이 메시 하나씩 들어 있다(trophy_{slug}). 금속 재질(tr_metal)만 메달 색으로 바꾸고 받침 재질(tr_dark)은 그대로 둔다.
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

useGLTF.preload(URL);
