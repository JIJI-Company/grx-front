// 석상 발치의 종이 등롱 (assets/castle/lantern.blend → public/castle/lantern.glb).
// 석상 하나의 등롱은 종이·틀 InstancedMesh 2개로 그린다 (최대 MAX_LANTERN_MODELS개라도 draw call 2번).
// 종이는 멤버 색으로 빛나고 조금씩 깜빡인다.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MAX_LANTERN_MODELS } from '../../castle/brightness';

const LANTERN_URL = '/castle/lantern.glb';
const FIRST_RING = 7; // 앞줄에 놓는 개수, 나머지는 뒷줄
const PAPER_GLOW = 1.4;

/** i번째 등롱 자리: 석상 앞쪽 부채꼴 두 줄. 석상 로컬 좌표(받침대 반폭 0.75) */
function slot(i: number, n: number): { x: number; z: number; rot: number } {
  const inFirst = i < FIRST_RING;
  const k = inFirst ? i : i - FIRST_RING;
  const m = inFirst ? Math.min(n, FIRST_RING) : n - FIRST_RING;
  const radius = inFirst ? 1.0 : 1.3;
  const spread = inFirst ? 2.2 : 2.6;
  const a = m > 1 ? (k / (m - 1) - 0.5) * spread : 0;
  return { x: Math.sin(a) * radius, z: Math.cos(a) * radius, rot: (i * 1.7) % (Math.PI * 2) };
}

export default function LanternRing({ count, color }: { count: number; color: string }) {
  const { scene } = useGLTF(LANTERN_URL);
  const geo = useMemo(() => {
    const out: { paper?: THREE.BufferGeometry; frame?: THREE.BufferGeometry } = {};
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // 노드 변환(합쳐진 틀 메시의 원점 오프셋 등)을 지오메트리에 굽는다
      const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      const name = (mesh.material as THREE.Material).name;
      if (name === 'lt_paper') out.paper = g;
      if (name === 'lt_frame') out.frame = g;
    });
    return out;
  }, [scene]);

  const paperMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f3e3c8', roughness: 0.9, emissive: new THREE.Color(color), emissiveIntensity: PAPER_GLOW }),
    [color],
  );
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#120c0a', roughness: 0.55 }), []);
  useEffect(() => () => void (paperMat.dispose(), frameMat.dispose()), [paperMat, frameMat]);

  const paper = useRef<THREE.InstancedMesh>(null!);
  const frame = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    if (!paper.current || !frame.current) return; // 등롱 0개면 메시를 그리지 않는다
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const s = slot(i, count);
      o.position.set(s.x, 0, s.z);
      o.rotation.set(0, s.rot, 0);
      o.updateMatrix();
      paper.current.setMatrixAt(i, o.matrix);
      frame.current.setMatrixAt(i, o.matrix);
    }
    paper.current.count = frame.current.count = count;
    paper.current.instanceMatrix.needsUpdate = frame.current.instanceMatrix.needsUpdate = true;
  }, [count, geo]);

  useFrame(({ clock }) => {
    // 불꽃처럼 불규칙한 깜빡임 (두 사인파 합)
    const t = clock.elapsedTime;
    paperMat.emissiveIntensity = PAPER_GLOW * (0.9 + 0.07 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1 + 1.3));
  });

  if (!geo.paper || !geo.frame || count === 0) return null;
  return (
    <group>
      <instancedMesh ref={paper} args={[geo.paper, paperMat, MAX_LANTERN_MODELS]} frustumCulled={false} />
      <instancedMesh ref={frame} args={[geo.frame, frameMat, MAX_LANTERN_MODELS]} frustumCulled={false} />
    </group>
  );
}

useGLTF.preload(LANTERN_URL);
