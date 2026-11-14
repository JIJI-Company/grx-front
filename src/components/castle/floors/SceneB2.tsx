// B2 상현의 방: 다다미 방, 가운데 통로 끝 해치. 기둥 숲·석등 길·병풍·높은 단으로 방을 채운다.
// 해치는 다다미 판 4장이라 B2→B3 연출 때 차례로 뒤집혀 열린다. 벽·천장의 상자 방은 배경.
import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { B2_DAIS, B2_HATCH as HATCH, B2_LANTERN_PATH, B2_PILLAR_RADIUS, B2_PILLARS, B2_SCREENS, type PlacedStatue } from '../../../castle/floors';
import { statueLightColor } from '../../../castle/brightness';
import { hatchDoorAngle, type ActiveTransition } from '../../../castle/transition';
import { BoxField, canvasTexture, Embers, glowTexture, Instanced, rng, scatter, useWindowTexture, type Placement } from './sceneParts';

/** 다다미 한 장 1.8 x 0.9m. 텍스처 한 장 = 3.6m 사방 */
const TATAMI_TILE = 3.6;

export default function SceneB2({ statues, fx }: { statues: PlacedStatue[]; fx: MutableRefObject<ActiveTransition | null> }) {
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
      <TatamiFloor />
      {/* 가운데 통로 (해치 앞까지) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -13]}>
        <planeGeometry args={[3.2, 34]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.3} metalness={0.2} />
      </mesh>
      <Hatch fx={fx} />
      <pointLight position={[0, 12, -17]} color="#ffb060" intensity={60} distance={45} />
      <BoxField boxes={boxes} />
      <PillarForest />
      <LanternPath />
      <FoldingScreens />
      <Dais />
      <HangingLanterns />
      <Banners statues={statues} />
      <DriftingRooms />
      <Embers count={300} seed={202} bounds={[-18, 18, 0, 10, -40, 6]} color="#ffb060" size={0.07} rise={0.12} opacity={0.6} />
    </group>
  );
}


/** 다다미 줄눈 텍스처: 3.6m 사방에 8장 (가로 2장·세로 2장 묶음이 엇갈린다) */
function tatamiTexture(repeat: number) {
  return canvasTexture(
    512,
    (g, n) => {
      const u = n / 4; // 0.9m
      const mat = (x: number, y: number, w: number, h: number, i: number) => {
        g.fillStyle = ['#6b5a31', '#665530', '#70603a', '#625230'][i % 4];
        g.fillRect(x, y, w, h);
        g.strokeStyle = 'rgba(30,22,8,0.18)'; // 짚 결
        g.lineWidth = 1;
        const along = w > h;
        for (let k = 3; k < (along ? h : w); k += 4) {
          g.beginPath();
          if (along) g.moveTo(x, y + k), g.lineTo(x + w, y + k);
          else g.moveTo(x + k, y), g.lineTo(x + k, y + h);
          g.stroke();
        }
        g.strokeStyle = '#1c1309'; // 테두리 천(헤리)
        g.lineWidth = 5;
        g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
      };
      let i = 0;
      for (const [qx, qy, horizontal] of [[0, 0, true], [2, 0, false], [0, 2, false], [2, 2, true]] as const) {
        for (let k = 0; k < 2; k++) {
          if (horizontal) mat(qx * u, (qy + k) * u, 2 * u, u, i++);
          else mat((qx + k) * u, qy * u, u, 2 * u, i++);
        }
      }
    },
    [repeat, repeat],
  );
}

/** 다다미 바닥: 해치 자리에 구멍이 뚫린 판 하나. UV = 월드 미터라 줄눈이 이어진다 */
function TatamiFloor() {
  const { geometry, material } = useMemo(() => {
    const shape = new THREE.Shape();
    // 바닥 x -20~20, z -40~6. Shape 평면 (x, y) → 월드 (x, 0, -y)
    shape.moveTo(-20, -6).lineTo(20, -6).lineTo(20, 40).lineTo(-20, 40).closePath();
    const hole = new THREE.Path();
    hole.moveTo(HATCH.x0, -HATCH.z1).lineTo(HATCH.x0, -HATCH.z0).lineTo(HATCH.x1, -HATCH.z0).lineTo(HATCH.x1, -HATCH.z1).closePath();
    shape.holes.push(hole);
    const tex = tatamiTexture(1 / TATAMI_TILE);
    return { geometry: new THREE.ShapeGeometry(shape), material: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }) };
  }, []);
  return <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />;
}

/** 해치: 좌우로 갈라지는 다다미 두 짝(바깥쪽 경첩) + 붉게 빛나는 구덩이 + 나무 테두리 */
function Hatch({ fx }: { fx: MutableRefObject<ActiveTransition | null> }) {
  const depth = HATCH.z1 - HATCH.z0;
  const width = HATCH.x1 - HATCH.x0;
  const zc = (HATCH.z0 + HATCH.z1) / 2;
  const boardTex = useMemo(() => tatamiTexture(1), []);
  const doors = useRef<THREE.Group[]>([]);
  useFrame(() => {
    const t = fx.current;
    const ms = t && t.kind === 'hatch' && t.phase === 'out' ? performance.now() - t.start : 0;
    const angle = hatchDoorAngle(ms);
    // 왼쪽(-x 경첩)은 -z축, 오른쪽은 +z축으로 돌아 가운데 모서리가 아래로 떨어진다
    doors.current.forEach((d, i) => d && (d.rotation.z = i === 0 ? -angle : angle));
  });
  return (
    <group>
      {[-1, 1].map((side, i) => (
        <group key={side} position={[side < 0 ? HATCH.x0 : HATCH.x1, 0, zc]} ref={(g) => g && (doors.current[i] = g)}>
          <mesh position={[(-side * width) / 4, -0.03, 0]}>
            <boxGeometry args={[width / 2 - 0.03, 0.06, depth - 0.04]} />
            <meshStandardMaterial map={boardTex} color="#9a7e50" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* 구덩이: 안쪽 면만 붉게 */}
      <mesh position={[0, -4, zc]}>
        <boxGeometry args={[width, 8, HATCH.z1 - HATCH.z0]} />
        <meshStandardMaterial color="#1a0204" emissive="#6a0610" emissiveIntensity={0.8} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.9, zc]}>
        <planeGeometry args={[width * 2, (HATCH.z1 - HATCH.z0) * 2]} />
        <meshBasicMaterial map={glowTexture()} color="#ff2a1a" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* 테두리: 옆·뒤는 나무 턱(충돌), 붉은 선은 해치 표시 */}
      {[
        [HATCH.x0 - 0.15, zc - 0.15, 0.3, HATCH.z1 - HATCH.z0 + 0.3],
        [HATCH.x1 + 0.15, zc - 0.15, 0.3, HATCH.z1 - HATCH.z0 + 0.3],
        [0, HATCH.z0 - 0.15, width + 0.6, 0.3],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.07, z]}>
          <boxGeometry args={[w, 0.14, d]} />
          <meshStandardMaterial color="#1a0d06" roughness={0.5} />
        </mesh>
      ))}
      {[
        [0, HATCH.z1, width + 0.1, 0.06],
        [0, HATCH.z0, width + 0.1, 0.06],
        [HATCH.x0, zc, 0.06, HATCH.z1 - HATCH.z0],
        [HATCH.x1, zc, 0.06, HATCH.z1 - HATCH.z0],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.15, z]}>
          <boxGeometry args={[w, 0.02, d]} />
          <meshBasicMaterial color="#ff2a2a" />
        </mesh>
      ))}
      <pointLight position={[0, -1.5, zc]} color="#ff2020" intensity={14} distance={9} />
    </group>
  );
}

const unitBox = () => new THREE.BoxGeometry(1, 1, 1);

// 붉은 옻칠 기둥 숲 (floors.ts B2_PILLARS). 기둥·받침·금장식·도리 = draw call 4번
function PillarForest() {
  const r = B2_PILLAR_RADIUS;
  const parts = useMemo(() => {
    // 걷기 영역 밖 바깥 줄은 어둡게 (안개 속 깊이감)
    const shafts: Placement[] = B2_PILLARS.map(([x, z]) => ({ p: [x, 4.5, z], c: Math.abs(x) > 15 ? '#6a6060' : '#ffffff' }));
    const bases: Placement[] = B2_PILLARS.map(([x, z]) => ({ p: [x, 0.15, z], s: [1, 0.3, 1] }));
    const caps: Placement[] = B2_PILLARS.map(([x, z]) => ({ p: [x, 9.05, z], s: [1, 0.18, 1] }));
    // 같은 x줄 기둥을 잇는 도리
    const beams: Placement[] = [...new Set(B2_PILLARS.map(([x]) => x))].map((x) => {
      const zs = B2_PILLARS.filter(([px]) => px === x).map(([, z]) => z);
      const z0 = Math.min(...zs);
      const z1 = Math.max(...zs);
      return { p: [x, 9.3, (z0 + z1) / 2], s: [0.5, 0.4, z1 - z0 + 1] };
    });
    return { shafts, bases, caps, beams };
  }, []);
  const g = useMemo(
    () => ({
      shaft: new THREE.CylinderGeometry(r * 0.85, r, 9, 16),
      base: unitBox(),
      cap: unitBox(),
      beam: unitBox(),
    }),
    [r],
  );
  const m = useMemo(
    () => ({
      shaft: new THREE.MeshStandardMaterial({ color: '#7d1712', roughness: 0.45 }),
      base: new THREE.MeshStandardMaterial({ color: '#1a0f08' }),
      cap: new THREE.MeshStandardMaterial({ color: '#b8860b', emissive: '#b8860b', emissiveIntensity: 0.35 }),
      beam: new THREE.MeshStandardMaterial({ color: '#3a0d0a' }),
    }),
    [],
  );
  return (
    <group>
      <Instanced geometry={g.shaft} material={m.shaft} items={parts.shafts} />
      <Instanced geometry={g.base} material={m.base} items={parts.bases} />
      <Instanced geometry={g.cap} material={m.cap} items={parts.caps} />
      <Instanced geometry={g.beam} material={m.beam} items={parts.beams} />
    </group>
  );
}

// 통로 양옆 석등 길 (floors.ts B2_LANTERN_PATH). 받침·기둥·화창·지붕 = draw call 4번, 광원 없이 블룸으로만 빛난다
function LanternPath() {
  const items = useMemo(() => {
    const at = (y: number, s: [number, number, number]) => B2_LANTERN_PATH.map(([x, z]): Placement => ({ p: [x, y, z], s }));
    return {
      stone: [...at(0.1, [0.6, 0.2, 0.6]), ...at(0.82, [0.5, 0.08, 0.5])],
      post: at(0.48, [1, 1, 1]),
      fire: at(1.05, [0.34, 0.38, 0.34]),
      roof: at(1.38, [1, 1, 1]),
    };
  }, []);
  const g = useMemo(
    () => ({
      stone: unitBox(),
      post: new THREE.CylinderGeometry(0.1, 0.13, 0.56, 8),
      fire: unitBox(),
      roof: new THREE.ConeGeometry(0.46, 0.34, 4).rotateY(Math.PI / 4),
    }),
    [],
  );
  const m = useMemo(() => {
    const stone = () => new THREE.MeshStandardMaterial({ color: '#5d5650', roughness: 0.95 });
    return {
      stone: stone(),
      post: stone(),
      roof: stone(),
      // ACES 톤 매핑 뒤에도 흰색으로 날아가지 않는 세기 (주황빛 크림)
      fire: new THREE.MeshStandardMaterial({ color: '#7a5030', emissive: '#ff9a50', emissiveIntensity: 1.0 }),
    };
  }, []);
  return (
    <group>
      <Instanced geometry={g.stone} material={m.stone} items={items.stone} />
      <Instanced geometry={g.post} material={m.post} items={items.post} />
      <Instanced geometry={g.fire} material={m.fire} items={items.fire} />
      <Instanced geometry={g.roof} material={m.roof} items={items.roof} />
    </group>
  );
}

/** 금박 병풍 그림: 금박 칸 + 먹으로 그린 산 능선·구름 띠 (특정 작품을 따르지 않는 일반 문양) */
function screenTexture() {
  return canvasTexture(256, (g, n) => {
    g.fillStyle = '#b8913a';
    g.fillRect(0, 0, n, n);
    g.strokeStyle = 'rgba(90,60,10,0.35)'; // 금박 이음매
    g.beginPath();
    for (let k = 0; k <= n; k += n / 8) {
      g.moveTo(k, 0);
      g.lineTo(k, n);
      g.moveTo(0, k);
      g.lineTo(n, k);
    }
    g.stroke();
    g.fillStyle = 'rgba(40,28,16,0.75)'; // 먹 산 능선
    g.beginPath();
    g.moveTo(0, n);
    for (let x = 0; x <= n; x += 8) g.lineTo(x, n * (0.7 - 0.12 * Math.sin(x * 0.03) * Math.sin(x * 0.011 + 1)));
    g.lineTo(n, n);
    g.fill();
    g.fillStyle = 'rgba(255,240,200,0.35)'; // 구름 띠
    g.fillRect(0, n * 0.18, n, n * 0.07);
    g.fillRect(0, n * 0.42, n, n * 0.05);
    g.strokeStyle = '#1a0d06'; // 테두리
    g.lineWidth = 10;
    g.strokeRect(0, 0, n, n);
  });
}

// 병풍 (floors.ts B2_SCREENS): 폭 1m 판을 지그재그로 접어 세운다. 모든 판이 InstancedMesh 1개
function FoldingScreens() {
  const items = useMemo(() => {
    const out: Placement[] = [];
    for (const s of B2_SCREENS) {
      const n = Math.round(s.width);
      const h = s.y > 0 ? 2.8 : 2.2;
      const c = Math.cos(s.rotY);
      const sn = Math.sin(s.rotY);
      for (let i = 0; i < n; i++) {
        const lx = (i - (n - 1) / 2) * 0.96;
        const lz = i % 2 ? 0.08 : -0.08;
        out.push({ p: [s.x + lx * c + lz * sn, s.y + h / 2, s.z - lx * sn + lz * c], r: [0, s.rotY + (i % 2 ? 0.32 : -0.32), 0], s: [1, h, 0.04] });
      }
    }
    return out;
  }, []);
  const geometry = useMemo(unitBox, []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map: screenTexture(), roughness: 0.55, metalness: 0.35, emissive: '#3a2604', emissiveIntensity: 0.6 }),
    [],
  );
  return <Instanced geometry={geometry} material={material} items={items} />;
}

// 해치 뒤 높은 단: 단·다다미 윗면·금테·계단 3칸
function Dais() {
  const { z0, z1, halfW, height } = B2_DAIS;
  const zc = (z0 + z1) / 2;
  const top = useMemo(() => tatamiTexture(0.5), []);
  return (
    <group>
      <mesh position={[0, height / 2, zc]}>
        <boxGeometry args={[halfW * 2, height, z1 - z0]} />
        <meshStandardMaterial color="#2a120a" roughness={0.6} />
      </mesh>
      <mesh position={[0, height + 0.01, zc]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfW * 2 - 0.4, z1 - z0 - 0.4]} />
        <meshStandardMaterial map={top} roughness={0.95} />
      </mesh>
      <mesh position={[0, height + 0.02, z1 - 0.05]}>
        <boxGeometry args={[halfW * 2, 0.06, 0.1]} />
        <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.5} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, (height / 3) * (i + 0.5), z1 + 0.45 * (2.5 - i)]}>
          <boxGeometry args={[4, (height / 3) * (i + 1), 0.45]} />
          <meshStandardMaterial color="#3a1a0c" roughness={0.6} />
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
            {/* ACES 톤 매핑 뒤에도 종이 색(주황빛 크림)이 남는 세기. 위 광원(60)의 난반사까지 더해진다 */}
            <meshStandardMaterial color="#6a4020" emissive="#ff9a50" emissiveIntensity={0.75} />
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

// 석상 뒤 멤버 색 깃발. 석상 빛을 받는 큰 면이라 밝은 멤버 색(노랑·하늘)은 하얗게 날아간다 →
// 색을 한 톤 눌러 천처럼 보이게 하고 자체 발광은 아주 약하게만 둔다
const BANNER_SHADE = 0.5;

function Banners({ statues }: { statues: PlacedStatue[] }) {
  return (
    <group>
      {statues.map((st) => {
        const side = Math.sign(st.x);
        const cloth = statueLightColor(st.color).multiplyScalar(BANNER_SHADE);
        return (
          <group key={st.memberId} position={[st.x + side * 3, 0, st.z]} rotation={[0, -side * (Math.PI / 2), 0]}>
            <mesh position={[0, 5.4, 0]}>
              <planeGeometry args={[2.6, 8]} />
              <meshStandardMaterial color={cloth} emissive={cloth} emissiveIntensity={0.12} side={THREE.DoubleSide} roughness={1} />
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
