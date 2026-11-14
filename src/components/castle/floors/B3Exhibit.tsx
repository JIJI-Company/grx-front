// B3 심층의 배경 부품: 거꾸로 떠서 천천히 도는 방·계단 조각, 그리고 '전장의 유물' 전시.
// 전시는 사람 없이 바닥에 떨어진 칼·장병기(카타나·와키자시·곧은 양날검·창·나기나타·십자창·칼집), 땅에 꽂힌 창·부러진 칼,
// 빈 겉옷·민무늬 가면을 건 옷걸이뿐이다. 특정 작품의 칼 모양을 따르지 않는 일반형이고, 피 표현은 없다.
// 어두운 심층에서 실루엣이 읽히도록 아래에서 약한 붉은 빛: 광원 2개 + 발밑 붉은 번짐(발광 평면 InstancedMesh 1개).
// 형상·유물은 public/castle/b3_exhibit.glb(원본 스크립트: 저장소 밖 assets/castle/b3_exhibit.py, Blender). 색은 정점 색.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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

// ── 떨어진 칼·장병기 7종 + 꽂힌 창 + 꽂힌 부러진 칼 + 옷걸이: GLB 메시. 앞 = +z, 바닥 = y 0
const EXHIBIT_URL = '/castle/b3_exhibit.glb';
/** 바닥에 눕힌 무기들 (GLB 노드 이름). 길이 가운데가 원점 */
const DROPPED = ['katana', 'wakizashi', 'straight', 'yari', 'naginata', 'jumonji', 'saya'] as const;
type Dropped = (typeof DROPPED)[number];

/** 무기가 흩어진 자리: 단 위(걷기 영역 밖, 거울에 비침)와 단 둘레 허공의 떠 있는 돌판 위. 자리마다 몇 자루가 엇갈려 떨어져 있다 */
const DROP_SITES: (Anchor & { count: number })[] = [
  { p: [-5.6, 0, -5.4], rotY: 0.75, scale: GROW, count: 4 },
  { p: [5.8, 0, -5.0], rotY: -0.8, scale: GROW, count: 4 },
  { p: [-7.7, 0, -0.6], rotY: 2.6, scale: GROW, count: 4 },
  { p: [7.5, 0, 2.2], rotY: -2.2, scale: GROW, count: 4 },
  { p: [-15, 2.6, -9], rotY: 1.2, scale: GROW, count: 2 },
  { p: [16, -3.6, -4], rotY: -1.9, scale: GROW, count: 2 },
  { p: [13, 4.2, -14], rotY: -0.6, scale: GROW, count: 2 },
  { p: [-13, -4.6, 5], rotY: 0.4, scale: GROW, count: 2 },
];
const DROP_SPREAD = 0.9;
/** 실제 비율이면 기본 카메라 거리에서 선처럼 보여, 굵기·폭은 크게, 길이는 조금만 키운다 (지역 축: x 폭, y 두께, z 길이) */
const DROP_SHAPE: Vec3 = [2.3, 2.3, 1.35];
const UPRIGHT_SHAPE: Vec3 = [2.0, 1.3, 2.0];
/** 땅에 꽂힌 창 (창대 끝을 박고 비스듬히) */
const STUCK_SPEARS: Anchor[] = [
  { p: [-6.2, 0, -6.6], rotY: 0.4, scale: GROW },
  { p: [6.9, 0, -4.4], rotY: -0.7, scale: GROW },
  { p: [16.8, -3.6, -3.2], rotY: 1.1, scale: GROW },
  { p: [-12.2, -4.6, 5.8], rotY: -0.3, scale: GROW },
];
const SPEAR_TILT: Vec3 = [-0.22, 0, 0.16];
const SPEAR_SINK = 0.25;

/** 자리마다 몇 자루씩, 종류·방향·위치를 고정 난수로 흩는다 (매번 같은 배치) */
function scatterDropped(): Record<Dropped, Placement[]> {
  const out = Object.fromEntries(DROPPED.map((k) => [k, [] as Placement[]])) as Record<Dropped, Placement[]>;
  const r = rng(303);
  let n = 0;
  for (const site of DROP_SITES) {
    for (let i = 0; i < site.count; i++, n++) {
      const kind = DROPPED[(n * 3 + Math.floor(r() * 2)) % DROPPED.length];
      const a = r() * Math.PI * 2;
      const d = r() * DROP_SPREAD;
      out[kind].push(place(site, { p: [Math.cos(a) * d, 0, Math.sin(a) * d], r: [0, r() * Math.PI * 2, 0], s: DROP_SHAPE }));
    }
  }
  return out;
}

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
const SWORD_TILT: Vec3 = [0.28, 0, 0.12];
/** 칼끝이 바닥에 박혀 보이도록 조금 묻는다 */
const SWORD_SINK = 0.08;

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

/** 단 둘레 전시 일체. draw call: 무기 9종·옷걸이(GLB 메시, 재질 1개) + 돌판 + 붉은 번짐 = 12번 */
export function DefeatedSwordsmen() {
  const { nodes } = useGLTF(EXHIBIT_URL);
  // Instanced가 언마운트 때 지오메트리를 버리므로 useGLTF 캐시 것은 복제해서 넘긴다(층을 다시 들어와도 재사용)
  const g = useMemo(() => {
    const geo = (name: string) => (nodes[name] as THREE.Mesh).geometry.clone();
    return {
      dropped: Object.fromEntries(DROPPED.map((k) => [k, geo(k)])) as Record<Dropped, THREE.BufferGeometry>,
      spear: geo('yari_up'),
      sword: geo('sword'),
      rack: geo('rack'),
      islet: new THREE.CylinderGeometry(0.5, 0.36, 1, 7),
      ember: new THREE.PlaneGeometry(1, 1),
    };
  }, [nodes]);
  const items = useMemo(() => {
    const spears = STUCK_SPEARS.map((sp) => place(sp, { p: [0, -SPEAR_SINK, 0], r: SPEAR_TILT, s: UPRIGHT_SHAPE }));
    const swords = SWORDS.map((sw) => place(sw, { p: [0, -SWORD_SINK, 0], r: SWORD_TILT, s: UPRIGHT_SHAPE }));
    const racks = RACKS.map((r) => place(r, { p: [0, 0, 0] }));
    const islets = ISLETS.map((p): Placement => ({ p: [p[0], p[1] - 0.35, p[2]], s: [3.2 * GROW, 0.7, 2.6 * GROW], r: [0, p[0] * 0.1, 0] }));
    // 무기·옷걸이 발밑의 붉은 번짐 (바닥에 눕힌 발광 평면)
    const embers = [...DROP_SITES, ...SWORDS, ...RACKS].map(
      (a): Placement => ({ p: [a.p[0], a.p[1] + 0.03, a.p[2]], r: [-Math.PI / 2, 0, 0], s: [a.scale * 2.6, a.scale * 2.6, 1] }),
    );
    return { dropped: scatterDropped(), spears, swords, racks, islets, embers };
  }, []);
  const m = useMemo(() => {
    // 정점 색(강철·옻칠·놋쇠·나무·천) + 어두운 심층에서도 형태가 읽히도록 아주 약하게 스스로 빛남(세면 색이 회색으로 바랜다)
    // color 배율: 붉고 어두운 심층 조명에서 묻히지 않게 정점 색을 고르게 밝힌다(색감은 그대로). 메시마다 재질을 따로 둔다(Instanced가 언마운트 때 버림)
    const exhibit = () =>
      new THREE.MeshStandardMaterial({ vertexColors: true, color: new THREE.Color().setScalar(1.8), roughness: 0.6, metalness: 0.25, emissive: '#2a2224', emissiveIntensity: 0.35 });
    return {
      dropped: Object.fromEntries(DROPPED.map((k) => [k, exhibit()])) as Record<Dropped, THREE.MeshStandardMaterial>,
      spear: exhibit(),
      sword: exhibit(),
      rack: exhibit(),
      islet: new THREE.MeshStandardMaterial({ color: '#2a1e20', roughness: 1 }),
      ember: new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#a01408', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    };
  }, []);
  return (
    <group>
      {DROPPED.map((k) => (
        <Instanced key={k} geometry={g.dropped[k]} material={m.dropped[k]} items={items.dropped[k]} />
      ))}
      <Instanced geometry={g.spear} material={m.spear} items={items.spears} />
      <Instanced geometry={g.sword} material={m.sword} items={items.swords} />
      <Instanced geometry={g.rack} material={m.rack} items={items.racks} />
      <Instanced geometry={g.islet} material={m.islet} items={items.islets} />
      <Instanced geometry={g.ember} material={m.ember} items={items.embers} />
      {UPLIGHTS.map((p) => (
        <pointLight key={p[0]} position={p} color={UPLIGHT_COLOR} intensity={14} distance={7} decay={1.6} />
      ))}
    </group>
  );
}

useGLTF.preload(EXHIBIT_URL);

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
