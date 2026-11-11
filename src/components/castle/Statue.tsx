// 석상 (임시 도형): 등롱 수에 따라 멤버 색으로 밝아지고, 방송 중이면 각성한다(눈빛·받침대 붉은 기운·이름표).
// 등롱 단계가 오를수록 몸 발광·광원 세기·도달 거리·발치 빛 번짐이 함께 커진다 (castle/brightness.ts).
// 등롱이 바쳐진 순간에는 같은 값들이 잠깐 튀었다가 단계 값으로 돌아온다 (castle/offering.ts statueFlash).
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { lanternTier, MAX_LANTERN_MODELS, statueGlow } from '../../castle/brightness';
import type { PlacedStatue } from '../../castle/floors';
import { statueFlash, type OfferEvent } from '../../castle/offering';
import { lanternCountLabel, statueCaption } from './castlePresentation';
import { glowTexture } from './floors/sceneParts';
import LanternRing from './LanternRing';

const AWAKE_EYE_BOOST = 6; // 1을 넘겨야 블룸이 잡힌다
const DORMANT_EYE = '#2a2226';
const AWAKE_EMBER = '#ff3020';
/** 반짝임 1일 때 더하는 값: 몸 발광, 광원 세기·도달 거리(scale 1 기준), 발치 빛 번짐 불투명도 */
const FLASH = { emissive: 1.6, light: 60, reach: 6, pool: 0.5 };

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

interface StatueProps {
  statue: PlacedStatue;
  count: number;
  awake: boolean;
  /** 이 석상의 등롱 연출 이벤트 (대개 빈 배열) */
  offers: readonly OfferEvent[];
}

export default function Statue({ statue: s, count, awake, offers }: StatueProps) {
  const tier = lanternTier(count);
  const glow = statueGlow(tier);
  const stone = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6d6669', roughness: 0.85, emissive: new THREE.Color(s.color), emissiveIntensity: 0 }),
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
  useEffect(() => () => void (stone.dispose(), poolMat.dispose()), [stone, poolMat]);
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
    let flash = 0;
    if (offers.length) {
      const now = performance.now();
      for (const e of offers) flash = Math.max(flash, statueFlash(e, now));
    }
    stone.emissiveIntensity = b.emissive + flash * FLASH.emissive;
    light.current.intensity = b.light + flash * FLASH.light * s.scale;
    light.current.distance = b.reach + flash * FLASH.reach * s.scale;
    poolMat.opacity = b.pool + flash * FLASH.pool;
    pool.current.scale.setScalar(pool.current.scale.x + (glow.poolRadius * 2 * s.scale - pool.current.scale.x) * k);
    if (s.float) root.current.position.y = s.lift + Math.sin(clock.elapsedTime * 0.6) * 0.35;
    pool.current.position.y = 0.03 - root.current.position.y; // 석상이 떠 있어도 바닥에 붙어 있게
  });

  return (
    <group ref={root} position={[s.x, s.lift, s.z]} rotation={[0, s.rotY, 0]}>
      <group scale={s.scale}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[1.5, 0.6, 1.5]} />
          <meshStandardMaterial color="#231d1f" roughness={0.9} />
        </mesh>
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
      <Html position={[0, 0.25 * s.scale, 0.95 * s.scale]} center zIndexRange={[100, 0]} distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap [text-shadow:0_0_6px_#000]">
          <div className="text-xs font-semibold text-ink-200">{statueCaption(s)}</div>
          <div className="text-[10px]" style={{ color: s.color }}>
            {lanternCountLabel(count)}
          </div>
          {awake && <div className="mt-0.5 text-[10px] font-semibold tracking-widest text-red-400 animate-pulse">● 방송 중</div>}
        </div>
      </Html>
    </group>
  );
}
