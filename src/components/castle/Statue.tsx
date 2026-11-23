// 석상 (임시 도형): 등롱 수에 따라 멤버 색으로 밝아지고, 방송 중이면 받침대 아래가 붉게 맥동한다(각성). 이름표·눈빛으로는 방송을 표시하지 않는다.
// 등롱 단계가 오를수록 몸 발광·광원 세기·도달 거리·발치 빛 번짐이 함께 커진다 (castle/brightness.ts).
// 등롱이 바쳐진 순간에는 같은 값들이 잠깐 튀었다가 단계 값으로 돌아온다 (castle/offering.ts statueFlash).
import { Component, Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { lanternTier, MAX_LANTERN_MODELS, statueGlow, statueLightColor } from '../../castle/brightness';
import type { PlacedStatue } from '../../castle/floors';
import { statueFlash, type OfferEvent } from '../../castle/offering';
import { revealEmerge, type Reveal } from '../../castle/reveal';
import { lanternCountLabel, statueCaption } from './castlePresentation';
import { opaqueMaterials, setFade } from './fadeIn';
import { glowTexture } from './floors/sceneParts';
import LanternRing from './LanternRing';
import { marbleStone, plainStone, sculptMaterial, STATUE_FINISH } from './sculpt';
import { seamlessNormals } from '../../castle/seamNormals';

const DORMANT_EYE = '#2a2226';
const AWAKE_EMBER = '#ff3020';
/** 반짝임 1일 때 더하는 값: 몸 발광, 광원 세기·도달 거리(scale 1 기준), 발치 빛 번짐 불투명도 */
const FLASH = { emissive: 0, light: 45, reach: 6, pool: 0.4 }; // 몸은 번쩍이지 않고 빛·발치만 (몸 발광은 뺐다)
/** 돌 기본색과 멤버 색을 섞는 비율: 돌 질감은 유지하고 멤버 색으로 은은하게 물든다 (0 = 회색 돌, 1 = 멤버 색) */
const STONE_COLOR = '#6d6669';
const STONE_TINT = 0.25;
/** 텍스처(채색) 석상의 비춤 빛 배율. 빛 세기(castle/brightness.ts)는 회색 돌(밝기 ~0.43)에 맞춘 값이라 피부색(~0.9)
 *  텍스처에는 2배 넘게 밝아 얼굴이 하얗게 날아간다(이목구비가 사라짐) → 돌 대비 피부 밝기 비율만큼 줄인다 */
const TEXTURED_LIGHT = 0.45;

/** 각성(방송 중) 표현: 받침대 아래 붉은 기운만. 천천히 맥동한다.
 * 눈빛 띠는 뺐다(2026-11-15) — 임시 도형 눈 높이에 고정이라 3D 모델 석상에서는 엉뚱한 곳에 떠 보였다 */
function AwakeAura() {
  const ember = useMemo(
    () => new THREE.MeshBasicMaterial({ map: glowTexture(), color: AWAKE_EMBER, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  useEffect(() => () => ember.dispose(), [ember]);
  useFrame(({ clock }) => {
    ember.opacity = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.8));
  });
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ember} renderOrder={1}>
      <planeGeometry args={[3.4, 3.4]} />
    </mesh>
  );
}

/** 임시 도형 몸체 (모델이 없거나 못 불러왔을 때) */
function PlaceholderBody({ stone, eye }: { stone: THREE.Material; eye: THREE.Color }) {
  return (
    <>
      <mesh position={[0, 1.35, 0]} material={stone}>
        <cylinderGeometry args={[0.42, 0.62, 1.5, 14]} />
      </mesh>
      <mesh position={[0, 1.95, 0]} material={stone}>
        <boxGeometry args={[1.25, 0.32, 0.55]} />
      </mesh>
      <mesh position={[0, 2.42, 0]} material={stone}>
        <sphereGeometry args={[0.36, 18, 14]} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 2.82, 0]} rotation={[0, 0, -x * 1.6]} material={stone}>
          <coneGeometry args={[0.08, 0.42, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.45, 0.33]}>
        <boxGeometry args={[0.38, 0.05, 0.05]} />
        <meshBasicMaterial color={eye} />
      </mesh>
    </>
  );
}

/** 석상 모델 높이(받침대 윗면 0.6 → 꼭대기 3.0, 임시 도형과 같은 키) */
const MODEL_HEIGHT = 2.4;

/** 멤버 석상 GLB: 받침대 위에 세운다. 재질은 텍스처(Paint) → 정점 색(투영 채색) → 돌 순으로 고른다.
 *  텍스처 재질은 메시마다 새로 만들어 textured에 넣는다 (발광은 Statue가 매 프레임 돌과 같은 값으로 맞춘다) */
function StatueModel({
  url,
  stone,
  paint,
  textured,
}: {
  url: string;
  stone: THREE.Material;
  paint: THREE.Material;
  textured: MutableRefObject<THREE.MeshStandardMaterial[]>;
}) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        const map = (m.material as THREE.MeshStandardMaterial).map;
        if (map) {
          const emissive = (paint as THREE.MeshStandardMaterial).emissive;
          const mat =
            (STATUE_FINISH === 'sculpt' && sculptMaterial(map, emissive)) ||
            // alphaTest: 투명하게 비운 부분(얼굴 앞에 뜬 앞머리 겹, project_face.py)은 그리지 않는다
            // 정점 색이 있으면 구운 그늘(bl_aovc.py)이라 텍스처에 곱한다
            new THREE.MeshStandardMaterial({ map, roughness: 0.8, emissive, vertexColors: !!m.geometry.attributes.color, alphaTest: (m.material as THREE.MeshStandardMaterial).alphaTest || 0 });
          textured.current.push(mat);
          m.material = mat;
        } else if (STATUE_FINISH === 'marble') {
          // 대리석 얼굴: 텍스처 없는 조각 머리·목. 정점 색은 색이 아니라 구운 그늘(bake_ao.py)이다
          const mat = marbleStone((paint as THREE.MeshStandardMaterial).emissive, !!m.geometry.attributes.color);
          textured.current.push(mat);
          m.material = mat;
        } else if (STATUE_FINISH === 'sculpt' && !m.geometry.attributes.color) {
          // 조각 머리(텍스처 없는 형태): 멤버 색 없이 몸과 같은 회색 돌
          const mat = plainStone((paint as THREE.MeshStandardMaterial).emissive);
          textured.current.push(mat);
          m.material = mat;
        } else {
          m.material = m.geometry.attributes.color ? paint : stone;
        }
        // 이름에 keepnormals: 파일에 든 조명용 법선(얼굴을 매끈하게 다듬은 것, project_face.py)을 그대로 쓴다
        if (!m.name.includes('keepnormals') || !m.geometry.attributes.normal) seamlessNormals(m.geometry);
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = MODEL_HEIGHT / size.y;
    root.scale.setScalar(k);
    const fit = new THREE.Box3().setFromObject(root);
    const c = fit.getCenter(new THREE.Vector3());
    root.position.set(-c.x, 0.6 - fit.min.y, -c.z);
    return root;
  }, [scene, stone, paint, textured]);
  useEffect(
    () => () => {
      textured.current.forEach((m) => m.dispose());
      textured.current = [];
    },
    [obj, textured],
  );
  return <primitive object={obj} />;
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('[castle] 석상 모델을 못 불러와 임시 도형으로 대체', e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface StatueProps {
  statue: PlacedStatue;
  count: number;
  awake: boolean;
  /** 이 석상의 등롱 연출 이벤트 (대개 빈 배열) */
  offers: readonly OfferEvent[];
  /** 있으면 입장 연출에 맞춰 숨겼다가 서서히 나타난다 (B3) */
  reveal?: Reveal;
}

export default function Statue({ statue: s, count, awake, offers, reveal }: StatueProps) {
  /** hidden: 아직 안 보임 → emerging: 서서히 나타나는 중 → shown: 다 나타남(이름표도 보임) */
  const [phase, setPhase] = useState<'hidden' | 'emerging' | 'shown'>(!reveal || reveal.revealedAt !== null ? 'shown' : 'hidden');
  const fading = useRef<THREE.Material[] | null>(null);
  const tier = lanternTier(count);
  const glow = statueGlow(tier);
  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(STONE_COLOR).lerp(new THREE.Color(s.color), STONE_TINT),
        roughness: 0.85,
        emissive: new THREE.Color(s.color),
        emissiveIntensity: 0,
      }),
    [s.color],
  );
  const eye = useMemo(() => {
    return new THREE.Color(tier > 0 ? s.color : DORMANT_EYE);
  }, [tier, s.color]);
  const lanterns = Math.min(count, MAX_LANTERN_MODELS);
  const root = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const pool = useRef<THREE.Mesh>(null!);
  const lightColor = useMemo(() => statueLightColor(s.color), [s.color]);
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: lightColor,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [lightColor],
  );
  /** 채색 모델용: 색은 정점에서, 발광(등롱·반짝임)은 돌과 같은 값을 매 프레임 따른다 */
  const paint = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: new THREE.Color(s.color), emissiveIntensity: 0 }),
    [s.color],
  );
  /** Paint 텍스처 모델의 메시별 재질 (StatueModel이 채운다) */
  const textured = useRef<THREE.MeshStandardMaterial[]>([]);
  useEffect(() => () => void (stone.dispose(), paint.dispose(), poolMat.dispose()), [stone, paint, poolMat]);
  /** 단계 값을 향해 부드럽게 따라가는 현재 값 (반짝임은 이 위에 더한다) */
  const base = useRef({ emissive: 0, light: glow.light * s.scale, reach: glow.reach * s.scale, pool: 0 });

  useFrame(({ clock }) => {
    // 단계 변화를 부드럽게
    const k = 0.05;
    const b = base.current;
    b.emissive += (glow.emissive - b.emissive) * k;
    b.light += (glow.light * s.scale - b.light) * k;
    b.reach += (glow.reach * s.scale - b.reach) * k;
    b.pool += (glow.pool - b.pool) * k;
    const now = performance.now();
    const emerge = reveal ? revealEmerge(reveal, now) : 1;
    if (phase !== 'shown' && emerge > 0) {
      setFade((fading.current ??= opaqueMaterials(root.current)), emerge);
      setPhase(emerge >= 1 ? 'shown' : 'emerging');
    }
    let flash = 0;
    for (const e of offers) flash = Math.max(flash, statueFlash(e, now));
    stone.emissiveIntensity = b.emissive + flash * FLASH.emissive;
    paint.emissiveIntensity = stone.emissiveIntensity;
    for (const t of textured.current) t.emissiveIntensity = stone.emissiveIntensity;
    const lightScale = textured.current.length ? TEXTURED_LIGHT : 1;
    light.current.intensity = (b.light + flash * FLASH.light * s.scale) * emerge * lightScale;
    light.current.distance = b.reach + flash * FLASH.reach * s.scale;
    poolMat.opacity = (b.pool + flash * FLASH.pool) * emerge;
    pool.current.scale.setScalar(pool.current.scale.x + (glow.poolRadius * 2 * s.scale - pool.current.scale.x) * k);
    if (s.float) root.current.position.y = s.lift + Math.sin(clock.elapsedTime * 0.6) * 0.35;
    pool.current.position.y = 0.03 - root.current.position.y; // 석상이 떠 있어도 바닥에 붙어 있게
  });

  return (
    <group ref={root} position={[s.x, s.lift, s.z]} rotation={[0, s.rotY, 0]} visible={phase !== 'hidden'}>
      <group scale={s.scale}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.5, 0.6, 1.5]} />
          <meshStandardMaterial color="#231d1f" roughness={0.9} />
        </mesh>
        {s.modelUrl ? (
          <ModelBoundary fallback={<PlaceholderBody stone={stone} eye={eye} />}>
            <Suspense fallback={null}>
              <StatueModel url={s.modelUrl} stone={stone} paint={paint} textured={textured} />
            </Suspense>
          </ModelBoundary>
        ) : (
          <PlaceholderBody stone={stone} eye={eye} />
        )}
        {awake && <AwakeAura />}
        {/* 발치 등롱 */}
        <Suspense fallback={null}>
          <LanternRing count={lanterns} color={`#${lightColor.getHexString()}`} />
        </Suspense>
      </group>
      <pointLight
        ref={light}
        position={[0, 2.6 * s.scale, 2 * s.scale]} // 석상에서 떨어뜨려 가까이서도 한 곳만 타지 않게
        color={lightColor}
        intensity={glow.light * s.scale}
        distance={glow.reach * s.scale}
        decay={1.6}
      />
      {/* 발치 바닥 빛 번짐: 떠 있는 석상도 바닥(y 0)에 깐다 */}
      <mesh ref={pool} material={poolMat} position={[0, 0.03 - s.lift, 0.6 * s.scale]} rotation={[-Math.PI / 2, 0, 0]} scale={glow.poolRadius * 2 * s.scale} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {/* distanceFactor: 먼 석상 이름표는 작아져서 서로 겹치지 않는다 */}
      {phase === 'shown' && (
        <Html position={[0, 0.25 * s.scale, 0.95 * s.scale]} center zIndexRange={[100, 0]} distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="text-center whitespace-nowrap [text-shadow:0_0_6px_#000]">
            <div className="text-xs font-semibold text-ink-200">{statueCaption(s)}</div>
            <div className="text-[10px]" style={{ color: s.color }}>
              {lanternCountLabel(count)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
