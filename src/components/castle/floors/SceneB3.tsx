// B3 심층: 수직 허공에 떠 있는 거울 단 + 다리. 단 둘레에 패배한 검사 전시, 붉은 균열·탑 불빛·뒤집힌 방 조각은 배경.
// 입장 연출(castle/reveal.ts): 짙은 안개 속 어둠 → 다리를 걸을수록 등이 켜지며 밝아짐 → 단 앞에서 석상·왕좌·마크가 서서히 드러남.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import { FLOORS } from '../../../castle/floors';
import { approach } from '../../../castle/interpolation';
import type { Motion } from '../../../castle/movement';
import { advanceReveal, LAMP_Z, lampOn, revealEmerge, type Reveal } from '../../../castle/reveal';
import { opaqueMaterials, setFade } from '../fadeIn';
import { DefeatedSwordsmen, FloatingFragments } from './B3Exhibit';
import { BoxField, canvasTexture, Embers, glowTexture, scatter } from './sceneParts';

const MARK_URL = '/castle/mark.webp'; // 꾸한성 마크(붉은 달 + 먹). 달 중심이 이미지 중심
const MARK_SIZE = 17; // 달 지름 ≈ 7.6m

// ── 역광: 석상 뒤 위쪽 좌우에서 비스듬히 내려와 윤곽선을 딴다 (머리 바로 뒤에 두면 후광처럼 보인다)
const BACKLIGHT_COLOR = '#dfe6ff';
const BACKLIGHT_AIM = new THREE.Vector3(0, 10.5, -7); // 석상 가슴~머리
const BACKLIGHT_FROM = [new THREE.Vector3(-15, 26, -12), new THREE.Vector3(15, 26, -12)];
/** 빛줄기 원뿔의 광원 쪽·석상 쪽 반지름 */
const SHAFT_RADIUS: [number, number] = [0.35, 4.6];
const UP = new THREE.Vector3(0, 1, 0);
const BACKLIGHT_INTENSITY = 8000;
const SHAFT_OPACITY = 0.09;

/** 뒤에서 오는 스포트라이트 2개 + 공중에 보이는 빛줄기. 그림자는 없다. 석상이 드러나는 만큼 켜진다 */
function Backlight({ reveal }: { reveal: Reveal }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.copy(BACKLIGHT_AIM);
    return o;
  }, []);
  // 광원 쪽이 밝고 석상에 닿기 전에 사라진다 (원뿔의 v: 위 1 → 아래 0)
  const fade = useMemo(() => {
    const t = canvasTexture(64, (g, size) => {
      const grad = g.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#444');
      grad.addColorStop(0.9, '#000');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
    });
    t.wrapT = THREE.ClampToEdgeWrapping; // 반복이면 원뿔 끝 테두리에 밝은 줄이 생긴다
    return t;
  }, []);
  const shaftMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: fade,
        color: BACKLIGHT_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [fade],
  );
  useEffect(() => () => void (fade.dispose(), shaftMat.dispose()), [fade, shaftMat]);
  const lights = useRef<THREE.SpotLight[]>([]);
  useFrame(() => {
    const power = revealEmerge(reveal, performance.now());
    for (const l of lights.current) l.intensity = BACKLIGHT_INTENSITY * power;
    shaftMat.opacity = SHAFT_OPACITY * power;
  });
  const shafts = useMemo(
    () =>
      BACKLIGHT_FROM.map((from) => {
        const dir = from.clone().sub(BACKLIGHT_AIM);
        return {
          from,
          length: dir.length(),
          mid: from.clone().add(BACKLIGHT_AIM).multiplyScalar(0.5),
          quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
        };
      }),
    [],
  );
  return (
    <group>
      <primitive object={target} />
      {shafts.map((s, i) => (
        <group key={i}>
          <spotLight
            ref={(l) => void (l && (lights.current[i] = l))}
            position={s.from}
            target={target}
            color={BACKLIGHT_COLOR}
            intensity={0}
            angle={0.3}
            penumbra={0.8}
            distance={60}
          />
          <mesh position={s.mid} quaternion={s.quat} material={shaftMat}>
            <cylinderGeometry args={[SHAFT_RADIUS[0], SHAFT_RADIUS[1], s.length, 32, 1, true]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── 다리 등: 걸어 들어온 만큼 앞쪽부터 차례로 켜진다
const LAMP_X = 1.75; // 다리 가장자리(1.4) 바로 바깥
const LAMP_COLOR = new THREE.Color('#ffb060');
const LAMP_TAU = 0.35;
/** 다 켜졌을 때: 등 밝기 배수(1을 넘겨야 블룸이 잡힌다), 바닥 빛 번짐 불투명도, 광원 세기 */
const LAMP_ON = { glow: 2.6, pool: 0.55, light: 5 };

function BridgeLamps({ reveal, low }: { reveal: Reveal; low: boolean }) {
  const mats = useMemo(
    () =>
      LAMP_Z.map(() => ({
        paper: new THREE.MeshBasicMaterial(),
        pool: new THREE.MeshBasicMaterial({ map: glowTexture(), color: LAMP_COLOR, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      })),
    [],
  );
  useEffect(() => () => mats.forEach((m) => void (m.paper.dispose(), m.pool.dispose())), [mats]);
  const lights = useRef<THREE.PointLight[]>([]);
  /** 등마다 켜진 정도 0~1. 이미 본 연출이면 처음부터 켜 둔다 */
  const level = useRef(LAMP_Z.map(() => (reveal.revealedAt === null ? 0 : 1)));
  useFrame((_, dt) => {
    const k = approach(dt, LAMP_TAU);
    LAMP_Z.forEach((lampZ, i) => {
      const l = (level.current[i] += ((lampOn(reveal, lampZ) ? 1 : 0) - level.current[i]) * k);
      mats[i].paper.color.copy(LAMP_COLOR).multiplyScalar(0.05 + LAMP_ON.glow * l);
      mats[i].pool.opacity = LAMP_ON.pool * l;
      if (lights.current[i]) lights.current[i].intensity = LAMP_ON.light * l;
    });
  });
  return (
    <group>
      {LAMP_Z.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          {[-LAMP_X, LAMP_X].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[0.07, 1.3, 0.07]} />
                <meshStandardMaterial color="#1a1113" roughness={0.8} />
              </mesh>
              <mesh position={[0, 1.48, 0]} material={mats[i].paper}>
                <boxGeometry args={[0.26, 0.36, 0.26]} />
              </mesh>
              <mesh position={[0, 1.69, 0]}>
                <boxGeometry args={[0.36, 0.05, 0.36]} />
                <meshStandardMaterial color="#1a1113" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats[i].pool} renderOrder={1}>
                <planeGeometry args={[2.8, 2.8]} />
              </mesh>
            </group>
          ))}
          {!low && <pointLight ref={(l) => void (l && (lights.current[i] = l))} position={[0, 1.5, 0]} color={LAMP_COLOR} intensity={0} distance={8} decay={1.6} />}
        </group>
      ))}
    </group>
  );
}

// ── 입장 연출의 밝기·안개: 도착(어둠) → 단 앞(절반) → 다 드러난 뒤(원래 값)
const LIT_START = 0.1;
const LIT_BEFORE_REVEAL = 0.5;
const FOG_START = 0.032;
const FOG_BEFORE_REVEAL = 0.02;
const FOG_END = FLOORS.B3.fogDensity;
const LIGHT = { ambient: 0.22, crack: 80, gold: 70 };
const lerp = THREE.MathUtils.lerp;

const FRAME: [number, number, number, number][] = [
  [0, 16.6, 9.6, 0.3],
  [-4.6, 9, 0.3, 15],
  [4.6, 9, 0.3, 15],
];
const RINGS: [number, number][] = [
  [2.4, 0.35],
  [5.2, 0.3],
  [8.5, 0.85],
];

export default function SceneB3({ low, motion, reveal }: { low: boolean; motion: Motion; reveal: Reveal }) {
  const towers = useMemo(
    () =>
      scatter(900, 33, (r) => {
        const a = r() * Math.PI * 2;
        const rad = 55 + r() * 140;
        const w = 6 + r() * 12;
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad - 5;
        if (Math.abs(x) < 14 && z < -20) return null; // 균열 앞은 비워 둔다
        if (z > 5 && Math.abs(x) < 60) return null; // 카메라 쪽은 비워서 허공이 보이게
        return { x, y: -220 + r() * 440, z, sx: w, sy: 20 + r() * 50, sz: w };
      }),
    [],
  );
  const mark = useTexture(MARK_URL);
  mark.colorSpace = THREE.SRGBColorSpace;
  const halo = useRef<THREE.Group>(null!);
  const throne = useRef<THREE.Group>(null!);
  const shrine = useRef<THREE.Group>(null!);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const crackLight = useRef<THREE.PointLight>(null!);
  const goldLight = useRef<THREE.PointLight>(null!);
  const markMat = useRef<THREE.MeshBasicMaterial>(null!);
  /** 왕좌처럼 불투명한 것들을 서서히 나타나게 할 때 쓰는 재질 목록 */
  const shrineMats = useRef<THREE.Material[] | null>(null);
  const shrineShown = useRef(reveal.revealedAt !== null);
  useFrame(({ clock, scene }, dt) => {
    const bob = Math.sin(clock.elapsedTime * 0.6) * 0.35;
    halo.current.rotation.z += dt * 0.08;
    halo.current.position.y = 12.9 + bob;
    throne.current.position.y = bob;

    // 입장 연출: 걸어 들어온 만큼 밝아지고 안개가 옅어지다가, 석상이 드러나는 동안 원래 값까지 서서히 걷힌다
    const now = performance.now();
    advanceReveal(reveal, motion.z, now);
    const open = revealEmerge(reveal, now);
    const lit = lerp(lerp(LIT_START, LIT_BEFORE_REVEAL, reveal.reach), 1, open);
    ambient.current.intensity = LIGHT.ambient * lit;
    crackLight.current.intensity = LIGHT.crack * lit;
    goldLight.current.intensity = LIGHT.gold * lit;
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = lerp(lerp(FOG_START, FOG_BEFORE_REVEAL, reveal.reach), FOG_END, open);
    shrine.current.visible = open > 0;
    if (open > 0 && !shrineShown.current) {
      setFade((shrineMats.current ??= opaqueMaterials(shrine.current)), open);
      shrineShown.current = open >= 1;
    }
    markMat.current.opacity = open;
  });
  return (
    <group>
      <ambientLight ref={ambient} intensity={0} color="#ff9a7a" />
      {/* 붉은 균열 */}
      <mesh position={[0, 0, -70]}>
        <planeGeometry args={[7, 800]} />
        <meshBasicMaterial color="#ff6a2a" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -72]}>
        <planeGeometry args={[60, 800]} />
        <meshBasicMaterial color="#a01208" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={crackLight} position={[0, 6, -20]} color="#ff3a1a" intensity={0} distance={60} />
      {/* 위에서 내려오는 금빛 */}
      <pointLight ref={goldLight} position={[0, 24, -4]} color="#ffc860" intensity={0} distance={45} decay={1.6} />
      <BoxField boxes={towers} repeatY={6} dim={0.45} />

      {/* 거울 바닥: 단과 그 둘레 허공을 반사면 하나로 (가장자리로 갈수록 투명) */}
      <MirrorFloor low={low} />
      <DefeatedSwordsmen />
      <FloatingFragments />
      {RINGS.map(([r, o]) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]}>
          <ringGeometry args={[r - 0.05, r, 128]} />
          <meshBasicMaterial color="#ffcf60" transparent opacity={o} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* 단 아래로 번지는 빛 (떠 있다는 느낌) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -1.5]}>
        <circleGeometry args={[14, 48]} />
        <meshBasicMaterial color="#ff8a30" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* 투명한 다리 + 금빛 테두리 */}
      <mesh position={[0, -0.03, 20]}>
        <boxGeometry args={[2.8, 0.04, 28]} />
        <meshStandardMaterial color="#ffcf80" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.01, 20]}>
          <boxGeometry args={[0.05, 0.05, 28]} />
          <meshBasicMaterial color="#ffcf60" />
        </mesh>
      ))}

      <BridgeLamps reveal={reveal} low={low} />

      {/* 석상 둘레(왕좌·마크·역광·빛기둥): 단 앞에 닿아야 나타나기 시작한다 */}
      <group ref={shrine} visible={false}>
        {/* 떠 있는 왕좌 등판 */}
        <group ref={throne}>
          <mesh position={[0, 9, -10.2]}>
            <boxGeometry args={[9, 15, 1]} />
            <meshStandardMaterial color="#22050a" roughness={0.6} />
          </mesh>
          {FRAME.map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, -9.6]}>
              <boxGeometry args={[w, h, 0.3]} />
              <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
        {/* 석상 뒤에서 천천히 도는 꾸한성 마크 */}
        <group ref={halo} position={[0, 12.9, -8.9]}>
          <mesh>
            <planeGeometry args={[MARK_SIZE, MARK_SIZE]} />
            <meshBasicMaterial ref={markMat} map={mark} transparent depthWrite={false} />
          </mesh>
        </group>
        <Backlight reveal={reveal} />
        {/* 석상을 관통하는 빛기둥 */}
        <mesh position={[0, 0, -7]}>
          <cylinderGeometry args={[3, 3, 400, 32, 1, true]} />
          <meshBasicMaterial color="#ffb040" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* 떠오르는 불티와 떠다니는 먼지: Points 1개 */}
      <Embers count={low ? 260 : 700} seed={77} bounds={[-45, 45, -50, 60, -60, 40]} color="#ff7a30" altColor="#8a7f86" size={0.28} rise={1.2} />
      {/* 출구 표시 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 31.5]}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
    </group>
  );
}

const MIRROR_RADIUS = 42;
const PLATFORM_RADIUS = 8.5;

/** 거울 바닥 알파: 단(반지름 8.5)은 진하게, 바깥 허공으로 갈수록 옅어진다 */
function useMirrorFade() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const k = PLATFORM_RADIUS / MIRROR_RADIUS;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(k * 0.97, '#fff');
    grad.addColorStop(k * 1.03, '#777');
    grad.addColorStop(0.55, '#2a2a2a');
    grad.addColorStop(1, '#000');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** 석상·등롱·사람이 거꾸로 비친다. 반사는 장면을 한 번 더 그리므로 저해상도 + blur, 저사양은 광택 재질로 대신 */
function MirrorFloor({ low }: { low: boolean }) {
  const fade = useMirrorFade();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1.5]} renderOrder={-1}>
      <circleGeometry args={[MIRROR_RADIUS, 96]} />
      {low ? (
        <meshStandardMaterial color="#3a1d24" roughness={0.18} metalness={0.75} alphaMap={fade} transparent depthWrite={false} />
      ) : (
        <MeshReflectorMaterial
          mirror={0.9}
          resolution={512}
          blur={[160, 60]}
          mixBlur={0.5}
          mixStrength={9}
          mixContrast={1.1}
          color="#6a4a52"
          roughness={0.3}
          metalness={0.35}
          alphaMap={fade}
          transparent
          depthWrite={false}
        />
      )}
    </mesh>
  );
}

useTexture.preload(MARK_URL);
