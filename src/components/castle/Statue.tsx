// 석상 (임시 도형): 등롱 수에 따라 멤버 색으로 밝아지고, 방송 중이면 각성한다(눈빛·받침대 붉은 기운·이름표).
// 등롱 단계가 오를수록 몸 발광·광원 세기·도달 거리·발치 빛 번짐이 함께 커진다 (castle/brightness.ts).
// 등롱이 바쳐진 순간에는 같은 값들이 잠깐 튀었다가 단계 값으로 돌아온다 (castle/offering.ts statueFlash).
import { Component, Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { lanternTier, MAX_LANTERN_MODELS, statueGlow } from '../../castle/brightness';
import type { PlacedStatue } from '../../castle/floors';
import { statueFlash, type OfferEvent } from '../../castle/offering';
import { revealEmerge, type Reveal } from '../../castle/reveal';
import { lanternCountLabel, statueCaption } from './castlePresentation';
import { opaqueMaterials, setFade } from './fadeIn';
import { glowTexture } from './floors/sceneParts';
import LanternRing from './LanternRing';
import { plainStone, sculptMaterial, STATUE_FINISH } from './sculpt';

const AWAKE_EYE_BOOST = 6; // 1을 넘겨야 블룸이 잡힌다
const DORMANT_EYE = '#2a2226';
const AWAKE_EMBER = '#ff3020';
/** 반짝임 1일 때 더하는 값: 몸 발광, 광원 세기·도달 거리(scale 1 기준), 발치 빛 번짐 불투명도 */
const FLASH = { emissive: 1.6, light: 60, reach: 6, pool: 0.5 };
/** 돌 기본색과 멤버 색을 섞는 비율: 돌 질감은 유지하고 멤버 색으로 은은하게 물든다 (0 = 회색 돌, 1 = 멤버 색) */
const STONE_COLOR = '#6d6669';
const STONE_TINT = 0.25;

/** 각성(방송 중) 표현: 눈빛 번짐 + 받침대 아래 붉은 기운. 석상 로컬 좌표, 천천히 맥동한다 */
function AwakeAura({ color }: { color: string }) {
  const mats = useMemo(() => {
    const glow = (c: THREE.ColorRepresentation) =>
      new THREE.MeshBasicMaterial({ map: glowTexture(), color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    return {
      eye: glow(color),
      ember: glow(AWAKE_EMBER),
    };
  }, [color]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.8);
    mats.eye.opacity = 0.75 + 0.25 * pulse;
    mats.ember.opacity = 0.35 + 0.3 * pulse;
  });
  return (
    <group>
      <mesh position={[0, 2.45, 0.37]} material={mats.eye}>
        <planeGeometry args={[1.1, 0.45]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ember} renderOrder={1}>
        <planeGeometry args={[3.4, 3.4]} />
      </mesh>
    </group>
  );
}

/** 임시 도형 몸체 (모델이 없거나 못 불러왔을 때) */
function PlaceholderBody({ stone, eye, awake }: { stone: THREE.Material; eye: THREE.Color; awake: boolean }) {
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
        <meshBasicMaterial color={eye} toneMapped={!awake} />
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
            new THREE.MeshStandardMaterial({ map, roughness: 0.8, emissive });
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
        m.geometry.computeVertexNormals();
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
    if (awake) return new THREE.Color(s.color).multiplyScalar(AWAKE_EYE_BOOST);
    return new THREE.Color(tier > 0 ? s.color : DORMANT_EYE);
  }, [awake, tier, s.color]);
  const lanterns = Math.min(count, MAX_LANTERN_MODELS);
  const root = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const pool = useRef<THREE.Mesh>(null!);
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: s.color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [s.color],
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
    light.current.intensity = (b.light + flash * FLASH.light * s.scale) * emerge;
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
          <ModelBoundary fallback={<PlaceholderBody stone={stone} eye={eye} awake={awake} />}>
            <Suspense fallback={null}>
              <StatueModel url={s.modelUrl} stone={stone} paint={paint} textured={textured} />
            </Suspense>
          </ModelBoundary>
        ) : (
          <PlaceholderBody stone={stone} eye={eye} awake={awake} />
        )}
        {awake && <AwakeAura color={s.color} />}
        {/* 발치 등롱 */}
        <Suspense fallback={null}>
          <LanternRing count={lanterns} color={s.color} />
        </Suspense>
      </group>
      <pointLight
        ref={light}
        position={[0, 1.4 * s.scale, 1.6 * s.scale]}
        color={s.color}
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
            {awake && <div className="mt-0.5 text-[10px] font-semibold tracking-widest text-red-400 animate-pulse">● 방송 중</div>}
          </div>
        </Html>
      )}
    </group>
  );
}
