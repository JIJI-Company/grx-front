// B3 심층의 배경 부품: 거꾸로 떠서 천천히 도는 방·계단 조각, 그리고 '패배한 검사' 전시.
// 전시는 이름 없는 일반 검사의 석화된 형상과 유물(부러진 칼·빈 겉옷·민무늬 가면)뿐이다.
// 특정 작품 캐릭터의 얼굴·옷 무늬·칼 모양을 따르지 않고, 피·시체 같은 표현 없이 회색 돌로만 만든다.
// 어두운 심층에서 실루엣이 읽히도록 아래에서 약한 붉은 빛: 광원 2개 + 발밑 붉은 번짐(발광 평면 InstancedMesh 1개).
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { B3_EXHIBIT_GROW as GROW } from '../../../castle/floors';
import { glowTexture, Instanced, rng, useWindowTexture, type Placement, type Vec3 } from './sceneParts';

// ── 공통: 부모(위치·y회전·배율) 안의 부품 자리 → 월드 자리
interface Anchor {
  p: Vec3;
  rotY: number;
  scale: number;
}
const tmpParent = new THREE.Object3D();
const tmpChild = new THREE.Object3D();
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();

function place(a: Anchor, local: Placement): Placement {
  tmpParent.position.set(...a.p);
  tmpParent.rotation.set(0, a.rotY, 0);
  tmpParent.scale.setScalar(a.scale);
  tmpParent.updateMatrix();
  tmpChild.position.set(...local.p);
  tmpChild.rotation.set(...(local.r ?? [0, 0, 0]));
  tmpChild.scale.set(...(local.s ?? [1, 1, 1]));
  tmpChild.updateMatrix();
  tmpM.multiplyMatrices(tmpParent.matrix, tmpChild.matrix).decompose(tmpP, tmpQ, tmpS);
  tmpE.setFromQuaternion(tmpQ);
  return { p: tmpP.toArray() as Vec3, r: [tmpE.x, tmpE.y, tmpE.z], s: tmpS.toArray() as Vec3, c: local.c };
}

// ── 석화된 검사: 캡슐(몸·팔다리) + 구(머리)로만. 앞 = +z
type Pose = 'kneel' | 'fallen';
type Part = Placement & { shape: 'capsule' | 'sphere' };
const H = Math.PI / 2;
/** 캡슐 지오메트리는 반지름 1·전체 길이 3 → s = [r, 길이/3, r] (len = 끝까지 전체 길이) */
const limb = (p: Vec3, r: Vec3, radius: number, len: number): Part => ({ shape: 'capsule', p, r, s: [radius, len / 3, radius] });

const POSES: Record<Pose, Part[]> = {
  // 무릎 꿇고 고개 숙임: 두 손은 무릎 위
  kneel: [
    { shape: 'sphere', p: [0, 1.0, 0.2], s: [0.13, 0.14, 0.13] },
    limb([0, 0.72, 0.06], [0.45, 0, 0], 0.18, 0.4),
    limb([0, 0.36, -0.06], [0, 0, H], 0.17, 0.2), // 허리 (넓은 하카마 자락)
    limb([-0.12, 0.24, 0.16], [H, 0, 0], 0.1, 0.42),
    limb([0.12, 0.24, 0.16], [H, 0, 0], 0.1, 0.42),
    limb([-0.12, 0.07, -0.08], [H, 0, 0], 0.08, 0.42),
    limb([0.12, 0.07, -0.08], [H, 0, 0], 0.08, 0.42),
    limb([-0.25, 0.56, 0.2], [0.9, 0, 0.15], 0.06, 0.42),
    limb([0.25, 0.56, 0.2], [0.9, 0, -0.15], 0.06, 0.42),
  ],
  // 앞으로 쓰러짐: 한 팔은 앞으로 뻗었다
  fallen: [
    { shape: 'sphere', p: [0.05, 0.14, 0.62], s: [0.13, 0.13, 0.14] },
    limb([0, 0.18, 0.2], [H, 0, 0], 0.18, 0.5),
    limb([0, 0.16, -0.15], [H, 0.2, 0], 0.17, 0.2),
    limb([-0.1, 0.1, -0.62], [H, 0.1, 0], 0.09, 0.8),
    limb([0.14, 0.1, -0.6], [H, -0.15, 0], 0.09, 0.8),
    limb([0.32, 0.08, 0.75], [H, -0.2, 0], 0.06, 0.6),
    limb([-0.3, 0.08, 0.2], [H, 0.6, 0], 0.06, 0.5),
  ],
};

/** 전시 배치: 단 위(걷기 영역 밖, 거울에 비침)와 단 둘레 허공의 떠 있는 돌판 위 */
const FIGURES: (Anchor & { pose: Pose })[] = [
  { pose: 'kneel', p: [-5.6, 0, -5.4], rotY: 0.75, scale: 1.25 * GROW }, // 석상을 향해 꿇어앉음
  { pose: 'kneel', p: [5.8, 0, -5.0], rotY: -0.8, scale: 1.25 * GROW },
  { pose: 'fallen', p: [-7.7, 0, -0.6], rotY: 2.6, scale: 1.25 * GROW },
  { pose: 'fallen', p: [7.5, 0, 2.2], rotY: -2.2, scale: 1.25 * GROW },
  { pose: 'kneel', p: [-15, 2.6, -9], rotY: 1.2, scale: 1.3 * GROW },
  { pose: 'fallen', p: [16, -3.6, -4], rotY: -1.9, scale: 1.3 * GROW },
  { pose: 'kneel', p: [13, 4.2, -14], rotY: -0.6, scale: 1.3 * GROW },
  { pose: 'fallen', p: [-13, -4.6, 5], rotY: 0.4, scale: 1.3 * GROW },
];
/** 떠 있는 돌판: 허공 전시대 (위 FIGURES의 허공 자리 아래) */
const ISLETS: Vec3[] = [
  [-15, 2.6, -9],
  [16, -3.6, -4],
  [13, 4.2, -14],
  [-13, -4.6, 5],
];

/** 부러진 칼: 바닥에 비스듬히 꽂힘. 민짜 날 + 네모 코등이 + 자루 (특정 칼 모양을 따르지 않는 일반형) */
const SWORDS: Anchor[] = [
  { p: [-6.6, 0, -3.3], rotY: 0.3, scale: GROW },
  { p: [4.0, 0, -5.8], rotY: -1.1, scale: GROW },
  { p: [7.7, 0, -1.8], rotY: 2.2, scale: GROW },
  { p: [-14.2, 2.6, -8.2], rotY: 0.9, scale: GROW },
  { p: [12.4, 4.2, -13.2], rotY: -0.4, scale: GROW },
];
const SWORD_PARTS: Placement[] = [
  { p: [0, 0.3, 0], s: [0.05, 0.62, 0.014], c: '#9a9498' }, // 부러진 날
  { p: [0, 0.63, 0], s: [0.16, 0.025, 0.1], c: '#3a3436' }, // 코등이
  { p: [0, 0.8, 0], s: [0.045, 0.32, 0.045], c: '#2a2224' }, // 자루
];
const SWORD_TILT: Vec3 = [0.28, 0, 0.12];

/** 빈 겉옷을 건 옷걸이(기둥 2 + 가로대) + 겉옷(몸판·소매) + 가로대 끝 민무늬 가면 */
const RACKS: Anchor[] = [
  { p: [-7.3, 0, -4.4], rotY: 1.1, scale: GROW },
  { p: [7.4, 0, -3.6], rotY: -1.2, scale: GROW },
];
/** 아래에서 비추는 붉은 빛 (전시 전체 광원 2개: 단 왼쪽·오른쪽 무리) */
const UPLIGHTS: Vec3[] = [
  [-6.6, 0.3, -3.2],
  [6.6, 0.3, -2.4],
];
const UPLIGHT_COLOR = '#ff2a18';
const RACK_BOXES: Placement[] = [
  { p: [-0.75, 0.85, 0], s: [0.06, 1.7, 0.06], c: '#2a1f1c' },
  { p: [0.75, 0.85, 0], s: [0.06, 1.7, 0.06], c: '#2a1f1c' },
  { p: [0, 1.62, 0], s: [1.9, 0.06, 0.06], c: '#2a1f1c' },
  { p: [0, 1.65, 0], s: [1.9, 0.04, 0.04], c: '#2a1f1c' },
  { p: [0, 1.05, 0.02], s: [0.6, 1.1, 0.04], c: '#6a6266' }, // 겉옷 몸판 (빛바랜 회색, 무늬 없음)
  { p: [-0.5, 1.42, 0.02], s: [0.42, 0.34, 0.04], c: '#5e575b' }, // 소매
  { p: [0.5, 1.42, 0.02], s: [0.42, 0.34, 0.04], c: '#5e575b' },
  { p: [-0.98, 1.38, 0.04], s: [0.03, 0.025, 0.02], c: '#120c0d' }, // 가면 눈구멍
  { p: [-0.9, 1.38, 0.04], s: [0.03, 0.025, 0.02], c: '#120c0d' },
];
const MASKS: Placement[] = [{ p: [-0.94, 1.36, 0.0], s: [0.1, 0.13, 0.04], c: '#c9c2bc' }];

/** 단 둘레 전시 일체 (돌 재질 하나 + 인스턴스 색). draw call: 캡슐·구·상자·돌판·붉은 번짐 = 5번 */
export function DefeatedSwordsmen() {
  const items = useMemo(() => {
    const capsules: Placement[] = [];
    const spheres: Placement[] = [];
    const boxes: Placement[] = [];
    for (const f of FIGURES) {
      for (const part of POSES[f.pose]) (part.shape === 'sphere' ? spheres : capsules).push(place(f, part));
    }
    for (const sw of SWORDS) {
      const tilted: Anchor = sw;
      for (const part of SWORD_PARTS) {
        // 꽂힌 기울기: 부품을 먼저 기울인 뒤 부모 자리로
        tmpChild.position.set(...part.p);
        tmpChild.position.applyEuler(tmpE.set(...SWORD_TILT));
        boxes.push(place(tilted, { ...part, p: tmpChild.position.toArray() as Vec3, r: SWORD_TILT }));
      }
    }
    for (const rack of RACKS) {
      for (const part of RACK_BOXES) boxes.push(place(rack, part));
      for (const m of MASKS) spheres.push(place(rack, m));
    }
    const islets = ISLETS.map((p): Placement => ({ p: [p[0], p[1] - 0.35, p[2]], s: [3.2 * GROW, 0.7, 2.6 * GROW], r: [0, p[0] * 0.1, 0] }));
    // 검사·칼·옷걸이 발밑의 붉은 번짐 (바닥에 눕힌 발광 평면)
    const embers = [...FIGURES, ...SWORDS, ...RACKS].map(
      (a): Placement => ({ p: [a.p[0], a.p[1] + 0.03, a.p[2]], r: [-Math.PI / 2, 0, 0], s: [a.scale * 2.6, a.scale * 2.6, 1] }),
    );
    return { capsules, spheres, boxes, islets, embers };
  }, []);
  const g = useMemo(
    () => ({
      capsule: new THREE.CapsuleGeometry(1, 1, 4, 10),
      sphere: new THREE.SphereGeometry(1, 14, 10),
      box: new THREE.BoxGeometry(1, 1, 1),
      islet: new THREE.CylinderGeometry(0.5, 0.36, 1, 7),
      ember: new THREE.PlaneGeometry(1, 1),
    }),
    [],
  );
  const m = useMemo(() => {
    // 어두운 심층에서도 형태가 읽히도록 아주 약하게 스스로 빛나는 회색 돌
    const stone = () => new THREE.MeshStandardMaterial({ color: '#9a9498', roughness: 0.9, emissive: '#3a3034', emissiveIntensity: 0.5 });
    return {
      capsule: stone(),
      sphere: stone(),
      box: new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.15 }),
      islet: new THREE.MeshStandardMaterial({ color: '#2a1e20', roughness: 1 }),
      ember: new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#a01408', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    };
  }, []);
  return (
    <group>
      <Instanced geometry={g.capsule} material={m.capsule} items={items.capsules} />
      <Instanced geometry={g.sphere} material={m.sphere} items={items.spheres} />
      <Instanced geometry={g.box} material={m.box} items={items.boxes} />
      <Instanced geometry={g.islet} material={m.islet} items={items.islets} />
      <Instanced geometry={g.ember} material={m.ember} items={items.embers} />
      {UPLIGHTS.map((p) => (
        <pointLight key={p[0]} position={p} color={UPLIGHT_COLOR} intensity={14} distance={7} decay={1.6} />
      ))}
    </group>
  );
}

// ── 거꾸로 떠 있는 방·계단 조각과 건물 파편. 조각마다 자기 축으로 천천히 돈다. draw call: 나무·창 = 2번
type Fragment = { p: Vec3; tilt: Vec3; spin: number; scale: number; kind: 'room' | 'stairs' | 'shard' };
const ROOM: Placement[] = [
  { p: [0, 0, 0], s: [4, 0.25, 4] }, // 바닥판
  { p: [-2, 1.4, 0], s: [0.2, 2.8, 4] }, // 벽
  { p: [0, 1.4, -2], s: [4, 2.8, 0.2] },
  { p: [0, 2.9, 0], s: [4.4, 0.3, 0.3] }, // 보
];
const ROOM_WINDOWS: Placement[] = [
  { p: [-1.88, 1.5, 0.6], s: [0.05, 1.5, 1.6] },
  { p: [0.6, 1.5, -1.88], s: [1.6, 1.5, 0.05] },
];
const STAIRS: Placement[] = Array.from({ length: 6 }, (_, i) => ({ p: [0, i * 0.35, -i * 0.45], s: [2, 0.35, 0.5] }));
const SHARD: Placement[] = [
  { p: [0, 0, 0], s: [2.4, 0.3, 1.6], r: [0, 0, 0.2] },
  { p: [0.5, 0.9, 0.2], s: [0.25, 1.8, 0.25] },
];

function makeFragments(): Fragment[] {
  const r = rng(303);
  const kinds: Fragment['kind'][] = ['room', 'stairs', 'room', 'shard', 'stairs', 'shard', 'room', 'shard', 'stairs', 'shard'];
  return kinds.map((kind, i) => {
    // 카메라가 있는 앞쪽(+z)은 비우고 양옆·뒤쪽 반원에만 둔다
    const a = Math.PI * (1 + (i / (kinds.length - 1)) * 1.0) + (r() - 0.5) * 0.2;
    const rad = 20 + r() * 22;
    // 위아래가 뒤집힌 채 (x축 π 근처) 비스듬히
    return {
      kind,
      p: [Math.cos(a) * rad, -8 + r() * 26, Math.sin(a) * rad - 6],
      tilt: [Math.PI + (r() - 0.5) * 0.8, r() * Math.PI * 2, (r() - 0.5) * 0.6],
      spin: (r() < 0.5 ? -1 : 1) * (0.03 + r() * 0.06),
      scale: 1 + r() * 1.2,
    };
  });
}

export function FloatingFragments() {
  const tex = useWindowTexture();
  const frags = useMemo(makeFragments, []);
  const parts = useMemo(() => {
    const wood: { f: number; local: Placement }[] = [];
    const glass: { f: number; local: Placement }[] = [];
    frags.forEach((fr, f) => {
      const set = fr.kind === 'room' ? ROOM : fr.kind === 'stairs' ? STAIRS : SHARD;
      set.forEach((local) => wood.push({ f, local }));
      if (fr.kind === 'room') ROOM_WINDOWS.forEach((local) => glass.push({ f, local }));
    });
    return { wood, glass };
  }, [frags]);
  const meshes = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const wood = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: '#3a2420', roughness: 0.85 }), parts.wood.length);
    const glass = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ map: tex, color: '#c08070' }), parts.glass.length);
    wood.frustumCulled = glass.frustumCulled = false;
    return { wood, glass };
  }, [parts, tex]);
  const o = useMemo(() => ({ frag: new THREE.Object3D(), part: new THREE.Object3D(), m: new THREE.Matrix4() }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const write = (mesh: THREE.InstancedMesh, list: { f: number; local: Placement }[]) => {
      list.forEach(({ f, local }, i) => {
        const fr = frags[f];
        o.frag.position.set(fr.p[0], fr.p[1] + Math.sin(t * 0.2 + f) * 0.8, fr.p[2]);
        o.frag.rotation.set(fr.tilt[0], fr.tilt[1] + t * fr.spin, fr.tilt[2]);
        o.frag.scale.setScalar(fr.scale);
        o.frag.updateMatrix();
        o.part.position.set(...local.p);
        o.part.rotation.set(...(local.r ?? [0, 0, 0]));
        o.part.scale.set(...(local.s ?? [1, 1, 1]));
        o.part.updateMatrix();
        mesh.setMatrixAt(i, o.m.multiplyMatrices(o.frag.matrix, o.part.matrix));
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    write(meshes.wood, parts.wood);
    write(meshes.glass, parts.glass);
  });
  return (
    <group>
      <primitive object={meshes.wood} />
      <primitive object={meshes.glass} />
    </group>
  );
}
