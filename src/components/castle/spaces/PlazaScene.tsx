// 광장: 도착 지점이자 방을 고르는 곳. 구름바다 위에 뜬 돌마당 둘레에 컨셉이 다른 건물이 선다.
// 지하(B1~B3)의 '끝없는 방' 배경과 달리 여기는 바깥이다: 밤하늘·붉은 달·별·먼 산과 성의 윤곽·구름바다.
//   북: History 전당(붉은 기둥·2층 지붕·금 트로피)  서: Content 화랑(길고 낮은 회랑·포스터 액자)
//   동: 관람실(극장·큰 간판 화면·등 기둥)            남서: 화실(팬아트, 아직 닫힘)  남: 무한성으로 내려가는 문
// 설계: planning/castle/spaces-20261112.md. 게임에서는 castle/floors.ts의 PLAZA(걷기 영역·충돌·문)와 같은 수치를 쓴다.
import { useMemo, useRef, type ReactNode, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PLAZA_BOARD, PLAZA_GATE_X, PLAZA_HALF, PLAZA_LAMPS } from '../../../castle/floors';
import { canvasTexture, Embers, glowTexture, rng, useWindowTexture } from '../floors/sceneParts';
import { GrandTrophy } from './GameTrophy';
import type { BoardDay } from './schedulePresentation';
import { GlowPool, Label, PaperLantern, Signboard, TileRoof, type Vec3 } from './parts';

export const PLAZA_FOG = { color: '#140c18', density: 0.0045 };
const HALF = PLAZA_HALF; // 마당 반쪽 크기(m)
const MARK_URL = '/castle/mark.webp';

interface Palette {
  pillar: string;
  wall: string;
  roof: string;
  trim: string;
  /** 창호·문에서 새어 나오는 빛 */
  glow: string;
}

/** 창호(종이창) 텍스처를 벽 크기에 맞춰 반복 */
function useShoji(repeatX: number, repeatY: number) {
  const base = useWindowTexture(1);
  return useMemo(() => {
    const t = base.clone();
    t.repeat.set(repeatX, repeatY);
    t.needsUpdate = true;
    return t;
  }, [base, repeatX, repeatY]);
}

interface PavilionProps {
  w: number;
  d: number;
  wallH: number;
  /** 기단 높이 */
  base?: number;
  /** 2면 위에 작은 몸채와 지붕을 한 층 더 올린다 */
  tiers?: 1 | 2;
  roofH?: number;
  doorW?: number;
  /** false면 문이 닫혀 어둡다 */
  open?: boolean;
  palette: Palette;
  sign: string;
  position: Vec3;
  rotationY?: number;
  children?: ReactNode;
}

/** 건물 한 채: 기단·계단, 몸채(창호 벽 + 가운데 문), 앞줄 기둥, 기와지붕, 현판. 앞 = +z, 원점 = 바닥 가운데 */
function Pavilion({ w, d, wallH, base = 0.9, tiers = 1, roofH = 2.4, doorW = 3, open = true, palette: p, sign, position, rotationY = 0, children }: PavilionProps) {
  const sideW = (w - doorW) / 2;
  const shoji = useShoji(sideW / 2, wallH / 2);
  const upperShoji = useShoji((w * 0.6) / 2, 1);
  const glow = useMemo(() => new THREE.Color(p.glow), [p.glow]);
  const front = d / 2;
  const porch = 1.6;
  const pillars = Math.max(4, Math.round(w / 3.4) + 1);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 기단과 앞 계단 */}
      <mesh position={[0, base / 2, porch / 2]}>
        <boxGeometry args={[w + 1.6, base, d + porch + 1.2]} />
        <meshStandardMaterial color="#2b2327" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, (base * (2 - i)) / 3 - base / 6, front + porch + 0.9 + i * 0.45]}>
          <boxGeometry args={[doorW + 3, base / 3, 0.5]} />
          <meshStandardMaterial color="#332a2e" roughness={0.9} />
        </mesh>
      ))}
      {/* 몸채 */}
      <mesh position={[0, base + wallH / 2, 0]}>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial color={p.wall} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (doorW + sideW)) / 2, base + wallH / 2, front + 0.02]}>
          <planeGeometry args={[sideW - 0.3, wallH - 0.5]} />
          <meshBasicMaterial map={shoji} color={open ? glow : glow.clone().multiplyScalar(0.12)} />
        </mesh>
      ))}
      {/* 문: 열려 있으면 안쪽 빛이 새어 나온다 */}
      <mesh position={[0, base + (wallH - 0.6) / 2, front + 0.03]}>
        <planeGeometry args={[doorW, wallH - 0.6]} />
        <meshBasicMaterial color={open ? glow.clone().multiplyScalar(1.05) : '#0a0707'} />
      </mesh>
      {open && <GlowPool position={[0, base + 0.02, front + 1.2]} size={doorW * 2.4} color={p.glow} opacity={0.55} />}
      {open && <pointLight position={[0, base + 2, front + 2.2]} color={p.glow} intensity={30} distance={16} decay={1.6} />}
      {/* 앞줄 기둥과 도리 */}
      {Array.from({ length: pillars }, (_, i) => {
        const x = -w / 2 + (w * i) / (pillars - 1);
        if (Math.abs(x) < doorW / 2 - 0.2) return null;
        return (
          <mesh key={i} position={[x, base + wallH / 2, front + porch]}>
            <cylinderGeometry args={[0.26, 0.3, wallH, 12]} />
            <meshStandardMaterial color={p.pillar} roughness={0.55} />
          </mesh>
        );
      })}
      <mesh position={[0, base + wallH - 0.2, front + porch]}>
        <boxGeometry args={[w + 0.8, 0.4, 0.5]} />
        <meshStandardMaterial color={p.pillar} roughness={0.55} />
      </mesh>
      <TileRoof w={w} d={d + porch} h={roofH} position={[0, base + wallH, porch / 2]} color={p.roof} trim={p.trim} />
      {tiers === 2 && (
        <>
          <mesh position={[0, base + wallH + roofH * 0.55 + 1.1, 0]}>
            <boxGeometry args={[w * 0.6, 2.6, d * 0.6]} />
            <meshStandardMaterial color={p.wall} roughness={0.85} />
          </mesh>
          <mesh position={[0, base + wallH + roofH * 0.55 + 1.5, d * 0.3 + 0.02]}>
            <planeGeometry args={[w * 0.6 - 0.4, 1.5]} />
            <meshBasicMaterial map={upperShoji} color={glow} />
          </mesh>
          <TileRoof w={w * 0.6} d={d * 0.6} h={roofH * 0.9} overhang={1.1} position={[0, base + wallH + roofH * 0.55 + 2.4, 0]} color={p.roof} trim={p.trim} />
        </>
      )}
      <Signboard text={sign} width={Math.min(doorW + 1.4, 5)} position={[0, base + wallH - 1.05, front + porch + 0.32]} />
      {children}
    </group>
  );
}

// ── History 전당: 붉은 기둥과 금. 계단 양옆 큰 트로피, 문 위 금 원판, 세로 깃발
const HISTORY: Palette = { pillar: '#8f1d14', wall: '#1d1114', roof: '#17100f', trim: '#d4a020', glow: '#ffc24a' };
function HistoryDecor({ w, d }: { w: number; d: number }) {
  const z = d / 2 + 3.6;
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 1.2), 0, z]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[1.5, 1.6, 1.5]} />
            <meshStandardMaterial color="#231a1d" roughness={0.8} />
          </mesh>
          {/* 전당 안쪽과 같은 대표 트로피 "붉은 달의 첨탑" */}
          <Suspense fallback={null}>
            <GrandTrophy position={[0, 1.6, 0]} scale={2} />
          </Suspense>
          <GlowPool position={[0, 0.03, 0]} size={5} color="#ffc24a" opacity={0.35} />
        </group>
      ))}
      {/* 문 위 금 원판 */}
      <mesh position={[0, 9.4, d / 2 + 1.7]}>
        <cylinderGeometry args={[1.1, 1.1, 0.12, 40]} />
        <meshStandardMaterial color="#d9a520" emissive="#d49a10" emissiveIntensity={1.3} metalness={0.4} roughness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.2), 4.2, d / 2 + 1.75]}>
          <mesh>
            <boxGeometry args={[0.9, 5.2, 0.05]} />
            <meshStandardMaterial color="#6e1410" roughness={0.8} />
          </mesh>
          <Label text={s < 0 ? '영' : '광'} width={0.8} height={0.9} color="#ffd772" glow={1.8} position={[0, 1.3, 0.04]} />
        </group>
      ))}
    </>
  );
}

// ── Content 화랑: 길고 낮은 회랑. 처마 밑에 포스터 액자가 줄지어 걸리고 액자마다 작은 등이 비춘다
const GALLERY: Palette = { pillar: '#3a2418', wall: '#1a1210', roof: '#141012', trim: '#8a6a3a', glow: '#ffe2b0' };
const POSTER_TINTS = ['#c94f4f', '#4f7fc9', '#d9a441', '#6fb07a', '#a36fc9', '#d97a4a'];
function GalleryDecor({ w, d }: { w: number; d: number }) {
  const z = d / 2 + 0.12;
  // 문 양옆으로 세 점씩
  const slots = POSTER_TINTS.map((c, i) => ({ c, x: (i < 3 ? -1 : 1) * (w / 2 - 2.2 - (i % 3) * 3) }));
  return (
    <>
      {slots.map(({ c, x }) => (
        <group key={c} position={[x, 3.1, z]}>
          <mesh>
            <boxGeometry args={[1.5, 2.1, 0.1]} />
            <meshStandardMaterial color="#0f0a0a" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[1.3, 1.9]} />
            <meshBasicMaterial color={new THREE.Color(c).multiplyScalar(1.15)} />
          </mesh>
          {/* 족자 위아래 봉 */}
          {[-1.12, 1.12].map((y) => (
            <mesh key={y} position={[0, y, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 1.7, 8]} />
              <meshStandardMaterial color="#8a6a3a" roughness={0.5} />
            </mesh>
          ))}
          <PaperLantern position={[0, 1.55, 0.5]} size={0.55} color="#ffe2b0" glow={2.6} />
        </group>
      ))}
    </>
  );
}

// ── 관람실: 극장. 문 위 큰 간판 화면이 천천히 숨 쉬듯 밝아지고, 양옆에 등이 세로로 줄지어 달린다
const THEATER: Palette = { pillar: '#1c1830', wall: '#12101c', roof: '#100e16', trim: '#c23b3b', glow: '#ff4a34' };
const SCREEN_COLOR = new THREE.Color('#ff4a3a');
function TheaterDecor({ w, d }: { w: number; d: number }) {
  const screen = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(({ clock }) => screen.current.color.copy(SCREEN_COLOR).multiplyScalar(0.16 + 0.07 * Math.sin(clock.elapsedTime * 1.4)));
  const z = d / 2 + 1.75;
  return (
    <>
      {/* 간판 화면 */}
      <group position={[0, 10.2, z - 0.6]}>
        <mesh>
          <boxGeometry args={[9.4, 3.6, 0.3]} />
          <meshStandardMaterial color="#0c0a12" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[8.8, 3]} />
          <meshBasicMaterial ref={screen} color={SCREEN_COLOR} />
        </mesh>
        <Label text="● ON AIR" width={5.4} height={1.2} color="#ff5a48" glow={2.6} position={[0, 0, 0.18]} />
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.1), 0, z]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <PaperLantern key={i} position={[0, 2 + i * 1.15, 0]} size={1.15} color="#ff5040" glow={2.4} />
          ))}
          <GlowPool position={[0, 0.03, 0.6]} size={5} color="#ff5040" opacity={0.35} />
        </group>
      ))}
    </>
  );
}

// ── 화실(팬아트): 작은 집. 아직 닫혀 있어 어둡고, 문에 빗장이 걸려 있다. 앞에 빈 캔버스를 올린 이젤
const ATELIER: Palette = { pillar: '#6a4a2c', wall: '#2a2018', roof: '#1a1412', trim: '#7a5a34', glow: '#ffd9a0' };
function AtelierDecor({ d }: { d: number }) {
  const z = d / 2 + 0.1;
  return (
    <>
      {[0.5, -0.5].map((r) => (
        <mesh key={r} position={[0, 2.5, z]} rotation={[0, 0, r]}>
          <boxGeometry args={[3.2, 0.22, 0.12]} />
          <meshStandardMaterial color="#4a3320" roughness={0.8} />
        </mesh>
      ))}
      {/* 이젤과 빈 캔버스 */}
      <group position={[3.4, 0, z + 2.6]} rotation={[0, -0.5, 0]}>
        {[-0.45, 0.45, 0].map((x, i) => (
          <mesh key={i} position={[x, 0.95, i === 2 ? -0.45 : 0]} rotation={[i === 2 ? 0.35 : -0.12, 0, x * -0.25]}>
            <boxGeometry args={[0.07, 1.9, 0.07]} />
            <meshStandardMaterial color="#5a3f26" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 1.25, 0.08]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[1.1, 1.3, 0.05]} />
          <meshStandardMaterial color="#e9e2d2" emissive="#e9e2d2" emissiveIntensity={0.25} roughness={0.9} />
        </mesh>
      </group>
      <PaperLantern position={[-2.6, 3.4, z + 1.7]} size={0.8} color="#ffd9a0" glow={1.3} />
      <group position={[-2.2, 0, z + 2.6]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshStandardMaterial color="#4a3320" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <boxGeometry args={[1.7, 0.6, 0.08]} />
          <meshStandardMaterial color="#2a1c12" roughness={0.8} />
        </mesh>
        <Label text="준비 중" width={1.5} height={0.42} color="#e2cfa6" glow={1.4} position={[0, 1.35, 0.05]} />
      </group>
    </>
  );
}

/** 무한성으로 내려가는 문: 붉은 문틀 아래로 계단이 꺼지고 밑에서 붉은 빛이 올라온다 */
function DescentGate({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 3, 0]}>
          <cylinderGeometry args={[0.3, 0.34, 6, 12]} />
          <meshStandardMaterial color="#8f1d14" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 6.1, 0]}>
        <boxGeometry args={[7, 0.45, 0.6]} />
        <meshStandardMaterial color="#17100f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[5.6, 0.3, 0.4]} />
        <meshStandardMaterial color="#8f1d14" roughness={0.5} />
      </mesh>
      <Signboard text="무한성" width={2.6} height={0.9} position={[0, 5.65, 0.34]} rotation={[0, Math.PI, 0]} />
      {/* 아래로 꺼지는 계단 */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, -0.15 - i * 0.3, 0.6 + i * 0.6]}>
          <boxGeometry args={[4.2, 0.3, 0.6]} />
          <meshStandardMaterial color="#2b2327" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, -2.4, 4.6]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[4.2, 3]} />
        <meshBasicMaterial color={new THREE.Color('#ff3a1a').multiplyScalar(1.6)} />
      </mesh>
      <pointLight position={[0, 0.5, 2]} color="#ff3a1a" intensity={26} distance={12} decay={1.6} />
      <GlowPool position={[0, 0.03, -0.8]} size={7} color="#ff3a1a" opacity={0.4} />
    </group>
  );
}

/** 돌마당 바닥: 판석 줄눈. 가운데에 꾸한성 마크와 금 고리 */
function Courtyard() {
  const stone = useMemo(
    () =>
      canvasTexture(
        256,
        (g, n) => {
          g.fillStyle = '#1c1719';
          g.fillRect(0, 0, n, n);
          const r = (seed: number) => ((Math.sin(seed * 91.7) + 1) * 0.5 * 1000) % 1;
          for (let y = 0; y < 4; y++)
            for (let x = 0; x < 4; x++) {
              const v = 30 + Math.floor(r(x * 7 + y * 13) * 12);
              g.fillStyle = `rgb(${v + 6},${v - 2},${v + 1})`;
              g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
            }
        },
        [HALF / 2, HALF / 2],
      ),
    [],
  );
  const mark = useTexture(MARK_URL);
  mark.colorSpace = THREE.SRGBColorSpace;
  return (
    <>
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[HALF * 2, 1.2, HALF * 2]} />
        <meshStandardMaterial map={stone} roughness={0.75} metalness={0.1} />
      </mesh>
      {/* 가장자리 금 띠 (윗면보다 낮아 옆 테두리만 보인다) */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[HALF * 2 + 0.3, 0.1, HALF * 2 + 0.3]} />
        <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[13, 13]} />
        <meshBasicMaterial map={mark} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {[4.6, 7.2].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[r - 0.05, r, 96]} />
          <meshBasicMaterial color="#ffcf60" transparent opacity={0.55} />
        </mesh>
      ))}
    </>
  );
}

/** 큰 등롱 높이(m): 도착 지점에서 전당 뒤 달을 가리지 않을 만큼 높이 */
const LANTERN_Y = 13;

/** 마당 가운데 위에 뜬 큰 등롱: 모이는 기준점이자 주 광원 */
function GreatLantern() {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => (ref.current.position.y = LANTERN_Y + Math.sin(clock.elapsedTime * 0.5) * 0.25));
  return (
    <group ref={ref} position={[0, LANTERN_Y, 0]}>
      <PaperLantern size={4.6} color="#ff9a48" glow={1.35} />
      <pointLight color="#ffb870" intensity={140} distance={70} decay={1.7} />
    </group>
  );
}

/** 돌등: 마당 가장자리를 따라 선다 */
function StoneLamp({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 1.4, 8]} />
        <meshStandardMaterial color="#4a4246" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.46, 0.42, 0.46]} />
        <meshBasicMaterial color={new THREE.Color('#ffb060').multiplyScalar(2.2)} />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.5, 0.36, 4]} />
        <meshStandardMaterial color="#3a3236" roughness={0.9} />
      </mesh>
      <GlowPool position={[0, 0.03, 0]} size={3.6} color="#ffb060" opacity={0.4} />
    </group>
  );
}

/** 게시판에 거는 쪽지 수(날짜 하나 = 쪽지 하나, 4 + 3). 쪽지에는 일정 3개까지, 나머지는 "+n" */
const BOARD_SLIPS = 7;
const SLIP_LINES = 3;

/** 게시판: 이번 주 일정을 날짜별 종이쪽지로 건다 (하루에 일정이 여러 개면 한 쪽지에 줄줄이) */
function NoticeBoard({ position, rotationY, days }: { position: Vec3; rotationY: number; days: BoardDay[] }) {
  const slips = useMemo(
    () =>
      Array.from({ length: BOARD_SLIPS }, (_, i) => {
        const row = i < 4 ? 0 : 1;
        const col = row === 0 ? i : i - 4;
        return { x: (row === 0 ? -1.4 : -0.93) + col * 0.93, y: 2.2 - row * 0.9, tilt: Math.sin(i * 12.9) * 0.04, day: days[i] };
      }),
    [days],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.16, 3, 0.16]} />
          <meshStandardMaterial color="#3a2418" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={[4, 1.9, 0.1]} />
        <meshStandardMaterial color="#241710" roughness={0.9} />
      </mesh>
      <TileRoof w={4} d={0.4} h={0.5} overhang={0.35} position={[0, 2.95, 0]} />
      {slips.map((s, i) => (
        <group key={s.day?.date ?? i} position={[s.x, s.y, 0.07]} rotation={[0, 0, s.tilt]}>
          <mesh>
            <planeGeometry args={[0.86, 0.82]} />
            <meshStandardMaterial color={s.day?.isToday ? '#f6e3b0' : '#efe6d0'} emissive="#efe6d0" emissiveIntensity={s.day?.events.length ? 0.3 : 0.1} roughness={0.9} />
          </mesh>
          {s.day && (
            <>
              <Label text={s.day.isToday ? `오늘 ${s.day.label}` : s.day.label} width={0.74} height={0.15} color="#8a1a12" position={[0, 0.3, 0.01]} />
              {!s.day.events.length && <Label text="일정 없음" width={0.6} height={0.14} color="#8a7a6a" position={[0, 0.02, 0.01]} />}
              {s.day.events.slice(0, SLIP_LINES).map((e, k) => (
                <Label key={e.id} text={e.time ? `${e.time} ${e.title}` : e.title} width={0.78} height={0.15} color="#1a120c" position={[0, 0.12 - k * 0.17, 0.01]} />
              ))}
              {s.day.events.length > SLIP_LINES && (
                <Label text={`+${s.day.events.length - SLIP_LINES}`} width={0.3} height={0.12} color="#5a4a3a" position={[0.26, -0.33, 0.01]} />
              )}
            </>
          )}
        </group>
      ))}
      <Label text="이번 주 일정" width={2} height={0.34} color="#f3d27a" glow={1.5} position={[0, 2.82, 0.3]} />
    </group>
  );
}

// ── 바깥 하늘. 안개의 영향을 받지 않게 전부 fog={false}
const SKY_RADIUS = 420;
const MOON_COLOR = new THREE.Color('#ff7a4a');

/** 먼 산줄기와 성·탑의 윤곽을 한 장에 그린다 (가로로 이어 붙는다) */
function skylineTexture() {
  const t = canvasTexture(1024, (g, n) => {
    const r = rng(7);
    const ridge = (base: number, amp: number, color: string) => {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(0, n);
      const first = base + (r() - 0.5) * amp;
      let y = first;
      for (let x = 0; x <= n; x += 16) {
        // 끝이 처음 높이로 돌아와야 이음매가 안 보인다
        y = x > n - 96 ? y + (first - y) * 0.35 : Math.min(n * 0.95, Math.max(n * 0.25, y + (r() - 0.5) * amp));
        g.lineTo(x, y);
      }
      g.lineTo(n, n);
      g.fill();
    };
    ridge(n * 0.62, 46, '#3d2646');
    ridge(n * 0.74, 34, '#27172f');
    // 탑과 성: 층층이 지붕이 달린 검은 윤곽 + 드문드문 켜진 창
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 112 + r() * 40;
      const floors = 2 + Math.floor(r() * 4);
      const w = 30 + r() * 26;
      let y = n * 0.8;
      for (let f = 0; f < floors; f++) {
        const fw = w * (1 - f * 0.13);
        const fh = 26;
        g.fillStyle = '#0e0812';
        g.fillRect(x - fw / 2, y - fh, fw, fh);
        g.beginPath(); // 처마
        g.moveTo(x - fw / 2 - 12, y - fh);
        g.lineTo(x + fw / 2 + 12, y - fh);
        g.lineTo(x + fw / 2 - 2, y - fh - 9);
        g.lineTo(x - fw / 2 + 2, y - fh - 9);
        g.fill();
        if (r() > 0.45) {
          g.fillStyle = 'rgba(255,170,80,0.85)';
          g.fillRect(x - 4 + (r() - 0.5) * fw * 0.5, y - fh + 9, 5, 8);
        }
        y -= fh + 9;
      }
    }
    g.fillStyle = '#0e0812';
    g.fillRect(0, n * 0.8, n, n * 0.2);
  }, [3, 1]);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** 밤하늘: 위는 짙은 남색, 지평선은 붉게. 큰 붉은 달이 전당 뒤에 뜬다 */
function NightSky({ low }: { low: boolean }) {
  const dome = useMemo(() => {
    const t = canvasTexture(256, (g, n) => {
      const grad = g.createLinearGradient(0, 0, 0, n);
      grad.addColorStop(0, '#04050d');
      grad.addColorStop(0.42, '#120d24');
      grad.addColorStop(0.56, '#3a1426');
      grad.addColorStop(0.64, '#5a1c1c');
      grad.addColorStop(0.74, '#1a0c16');
      grad.addColorStop(1, '#08050a');
      g.fillStyle = grad;
      g.fillRect(0, 0, n, n);
    });
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, []);
  const skyline = useMemo(skylineTexture, []);
  const stars = useMemo(() => {
    const r = rng(19);
    const n = low ? 500 : 1300;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const h = 0.12 + r() * 0.88; // 지평선 위쪽만
      const rad = Math.sqrt(1 - h * h) * (SKY_RADIUS - 20);
      pos.set([Math.cos(a) * rad, h * (SKY_RADIUS - 20), Math.sin(a) * rad], i * 3);
    }
    return pos;
  }, [low]);
  const moonColor = useMemo(() => MOON_COLOR.clone().multiplyScalar(1.5), []);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
        <meshBasicMaterial map={dome} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d8dcff" size={1.6} sizeAttenuation={false} transparent opacity={0.85} fog={false} depthWrite={false} />
      </points>
      {/* 붉은 달과 달무리 */}
      <group position={[-40, 120, -330]}>
        <mesh>
          <circleGeometry args={[46, 64]} />
          <meshBasicMaterial color={moonColor} fog={false} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[300, 300]} />
          <meshBasicMaterial map={glowTexture()} color="#ff5a30" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
        </mesh>
      </group>
      {/* 먼 산과 성의 윤곽 */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[SKY_RADIUS - 60, SKY_RADIUS - 60, 190, 64, 1, true]} />
        <meshBasicMaterial map={skyline} side={THREE.BackSide} transparent alphaTest={0.5} fog={false} />
      </mesh>
    </group>
  );
}

/** 구름바다: 마당 아래에 깔리고, 가장자리로 구름 덩이가 천천히 흘러간다 */
const CLOUDS = (() => {
  const r = rng(88);
  return Array.from({ length: 26 }, () => {
    const a = r() * Math.PI * 2;
    const rad = 34 + r() * 150;
    return { x: Math.cos(a) * rad, z: Math.sin(a) * rad, y: -9 - r() * 10, size: 50 + r() * 70, speed: 0.4 + r() * 0.8 };
  });
})();
function CloudSea() {
  const group = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    group.current.children.forEach((c, i) => {
      c.position.x += CLOUDS[i].speed * dt;
      if (c.position.x > 190) c.position.x = -190;
    });
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, 0]}>
        <circleGeometry args={[SKY_RADIUS - 70, 48]} />
        <meshBasicMaterial color="#1a1020" fog={false} />
      </mesh>
      <group ref={group}>
        {CLOUDS.map((c, i) => (
          <mesh key={i} position={[c.x, c.y, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[c.size, c.size]} />
            <meshBasicMaterial map={glowTexture()} color="#6a4a66" transparent opacity={0.34} depthWrite={false} fog={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

const LAMPS: Vec3[] = PLAZA_LAMPS.map(([x, z]) => [x, 0, z]);

export default function PlazaScene({ low, days = [] }: { low: boolean; /** 게시판에 걸 이번 주 일정(날짜별) */ days?: BoardDay[] }) {
  return (
    <group>
      <ambientLight intensity={0.22} color="#ffcf9a" />
      <hemisphereLight args={['#6a6ab0', '#1a0c10', 0.35]} />
      {/* 달빛: 등불의 따뜻한 빛과 대비되는 차가운 빛이 지붕과 바닥에 얹힌다 */}
      <directionalLight position={[-40, 120, -330]} color="#9aa6ff" intensity={0.55} />
      <NightSky low={low} />
      <CloudSea />
      <Courtyard />
      <GreatLantern />
      {LAMPS.map((p, i) => (
        <StoneLamp key={i} position={p} />
      ))}
      <NoticeBoard position={[PLAZA_BOARD.x, 0, PLAZA_BOARD.z]} rotationY={PLAZA_BOARD.rotY} days={days} />

      <Pavilion w={18} d={9} wallH={6.6} tiers={2} roofH={3} doorW={4} palette={HISTORY} sign="전당" position={[0, 0, -HALF - 7.5]}>
        <HistoryDecor w={18} d={9} />
      </Pavilion>
      <Pavilion w={24} d={6} wallH={4.4} roofH={1.9} doorW={3.2} palette={GALLERY} sign="화랑" position={[-HALF - 6, 0, -1]} rotationY={Math.PI / 2}>
        <GalleryDecor w={24} d={6} />
      </Pavilion>
      <Pavilion w={17} d={9} wallH={7.2} roofH={3.4} doorW={4.4} palette={THEATER} sign="관람실" position={[HALF + 7.5, 0, -1]} rotationY={-Math.PI / 2}>
        <TheaterDecor w={17} d={9} />
      </Pavilion>
      <Pavilion w={7} d={5} wallH={3.6} base={0.5} roofH={1.7} doorW={2.4} open={false} palette={ATELIER} sign="화실" position={[-10.5, 0, HALF + 5.5]} rotationY={Math.PI}>
        <AtelierDecor d={5} />
      </Pavilion>
      <DescentGate position={[PLAZA_GATE_X, 0, HALF]} />

      <Embers count={low ? 160 : 420} seed={51} bounds={[-34, 34, 0, 26, -34, 34]} color="#ffb060" altColor="#8a7f86" size={0.14} rise={0.35} opacity={0.7} />
    </group>
  );
}

useTexture.preload(MARK_URL);
