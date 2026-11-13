// History 전당 내부: 대회 수상 기록을 하나씩 유리 케이스에 넣어 전시한다(박물관식). 붉은 기둥·금·검은 옻칠.
//   가운데 붉은 융단 통로 → 양옆에 종목별로 모인 개별 전시대(받침대 + 유리 케이스 속 트로피 + 명판, 뒤 벽에 사진) → 맨 안쪽 합계 현판
// 설계: planning/castle/spaces-20261112.md §4-2. 아직 미리보기(/castle-preview) 전용이라 걷기 영역·충돌은 없다.
import { Suspense, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { canvasTexture, Embers } from '../floors/sceneParts';
import GameTrophy from './GameTrophy';
import { GlowPool, Label, PaperLantern, Signboard, Trophy, type Medal, type Vec3 } from './parts';
import { formatDate, getAchievementMemberProfiles, MEDAL_LABEL, type HistoryMemberProfileMap } from '../../history/historyPresentation';
import {
  EXHIBIT_SPACING,
  exhibitSpots,
  groupByCategory,
  medalTotals,
  nearestExhibit,
  placeBays,
  type BayPlacement,
  type HallRecord,
} from './historyHallPresentation';

export const HISTORY_HALL_FOG = { color: '#120807', density: 0.012 };

const HALF_W = 11; // 벽까지
const AISLE = 1.6; // 융단 반쪽 폭
const PILLAR_X = 4.6;
const CEILING = 9;
/** 기둥 간격과 첫 전시대가 시작하는 z */
const PILLAR_GAP = 7;
const FIRST_Z = -1.5;
/** 전시대 줄의 x(통로 가운데에서)와, 그 줄에서 뒤 벽까지의 거리 */
const EXHIBIT_X = 6.3;
const WALL_BEHIND = HALF_W - 0.2 - EXHIBIT_X;

const PHOTO = { w: 1.48, h: 0.98 };

/** 수상 사진: 액자 크기에 맞춰 가운데를 잘라 채운다 */
function Photo({ url, w, h }: { url: string; w: number; h: number }) {
  const tex = useTexture(url);
  const image = tex.image as { width: number; height: number };
  const ratio = image.width / image.height / (w / h);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(ratio > 1 ? 1 / ratio : 1, ratio > 1 ? 1 : ratio);
  tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
  return (
    <mesh position={[0, 0, 0.09]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color="#d8d0c8" />
    </mesh>
  );
}

const CASE = { w: 0.92, h: 1.45 };
const PEDESTAL_H = 1.05;
const CASE_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(CASE.w, CASE.h, CASE.w));
/** 이 거리 안으로 다가가면 그 전시대의 정보 카드가 뜬다(m) */
const NEAR_RADIUS = 4.2;

/** 전시대 정보 카드: 메달·대회명·종목·날짜와 참가 멤버 (History 페이지의 hover 내용과 같다) */
function RecordCard({ record, profiles }: { record: HallRecord; profiles: HistoryMemberProfileMap }) {
  const known = getAchievementMemberProfiles(record.members, profiles);
  const knownNames = new Set(known.map((p) => p.name));
  const others = record.members.filter((name) => !knownNames.has(name.trim()));
  return (
    <div className="w-max max-w-[300px] border border-gold-400/50 bg-castle-950/90 px-4 py-3 text-center font-['Noto_Serif_KR',serif] whitespace-normal shadow-[0_0_18px_#000]">
      <div className="text-[10px] tracking-[0.3em] text-gold-400">{MEDAL_LABEL[record.medal]}</div>
      <div className="mt-1 text-base font-semibold text-ink-50">{record.title}</div>
      <div className="mt-0.5 text-[11px] text-ink-400">
        {record.category} · {formatDate(record.date)}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {known.map((p) => (
          <span key={p.name} className="flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[11px] font-semibold" style={{ backgroundColor: p.personalColor, color: p.labelTextColor }}>
            <img src={p.avatar} alt="" className="size-5 rounded-full object-cover" />
            {p.name}
          </span>
        ))}
        {others.map((name) => (
          <span key={name} className="rounded-full border border-ink-500 px-2 py-0.5 text-[11px] text-ink-200">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ExhibitProps {
  record: HallRecord;
  position: Vec3;
  /** 정보 카드를 띄울 차례인가 (마우스를 올렸거나 가장 가까이 있음) */
  active: boolean;
  profiles: HistoryMemberProfileMap;
  onHover: (id: string | null) => void;
}

/** 전시대 하나: 받침대 + 유리 케이스 속 트로피 + 명판. 앞 = +z */
function Exhibit({ record, position, active, profiles, onHover }: ExhibitProps) {
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(record.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      {active && (
        <Html position={[0, PEDESTAL_H + CASE.h + 0.75, 0]} center distanceFactor={4.6} zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
          <RecordCard record={record} profiles={profiles} />
        </Html>
      )}
      <mesh position={[0, PEDESTAL_H / 2, 0]}>
        <boxGeometry args={[1.02, PEDESTAL_H, 1.02]} />
        <meshStandardMaterial color="#140e0f" roughness={0.3} metalness={0.25} />
      </mesh>
      {/* 받침대 위아래 금 띠 */}
      {[0.05, PEDESTAL_H - 0.04].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.06, 0.06, 1.06]} />
          <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* 케이스 바닥의 조명판: 트로피를 아래에서 비춘다 */}
      <mesh position={[0, PEDESTAL_H + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CASE.w - 0.1, CASE.w - 0.1]} />
        <meshBasicMaterial color={new THREE.Color('#ffe2a8').multiplyScalar(1.25)} />
      </mesh>
      <Suspense fallback={null}>
        <GameTrophy category={record.category} medal={record.medal} position={[0, PEDESTAL_H + 0.03, 0]} scale={1.18} />
      </Suspense>
      {/* 유리 케이스: 옅은 유리면 + 밝은 모서리 선 */}
      <group position={[0, PEDESTAL_H + CASE.h / 2, 0]}>
        <mesh renderOrder={2}>
          <boxGeometry args={[CASE.w, CASE.h, CASE.w]} />
          <meshStandardMaterial color="#cfe6ff" transparent opacity={0.09} roughness={0.05} metalness={0.3} depthWrite={false} />
        </mesh>
        <lineSegments geometry={CASE_EDGES}>
          <lineBasicMaterial color={active ? '#ffd772' : '#dfeeff'} transparent opacity={active ? 1 : 0.55} />
        </lineSegments>
      </group>
      {/* 명판 */}
      <mesh position={[0, 0.62, 0.52]}>
        <boxGeometry args={[0.84, 0.26, 0.03]} />
        <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
      <Label text={record.title} width={0.78} height={0.2} color="#1a0f08" position={[0, 0.62, 0.54]} />
    </group>
  );
}

/** 종목 하나: 전시대가 한 줄로 서고, 뒤 벽에 전시대마다 사진 액자, 그 위에 종목 현판 */
function CategoryRow({ bay, activeId, profiles, onHover }: { bay: BayPlacement; activeId: string | null; profiles: HistoryMemberProfileMap; onHover: (id: string | null) => void }) {
  const n = bay.records.length;
  const length = n * EXHIBIT_SPACING;
  return (
    <group position={[bay.side * EXHIBIT_X, 0, bay.z]} rotation={[0, (bay.side * -Math.PI) / 2, 0]}>
      {/* 앞 = +z(통로 쪽). 줄 아래 낮은 단 */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[length + 0.5, 0.12, 1.9]} />
        <meshStandardMaterial color="#1c1213" roughness={0.4} metalness={0.2} />
      </mesh>
      {bay.records.map((r, i) => {
        const x = (i - (n - 1) / 2) * EXHIBIT_SPACING;
        return (
          <group key={r.id}>
            <Exhibit record={r} position={[x, 0.12, 0]} active={r.id === activeId} profiles={profiles} onHover={onHover} />
            <group position={[x, 4.25, -WALL_BEHIND + 0.08]}>
              <mesh>
                <boxGeometry args={[PHOTO.w + 0.14, PHOTO.h + 0.14, 0.14]} />
                <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.45} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0, 0.08]}>
                <planeGeometry args={[PHOTO.w, PHOTO.h]} />
                <meshStandardMaterial color="#3a2a26" emissive="#5a3a20" emissiveIntensity={0.35} roughness={0.9} />
              </mesh>
              {r.image && (
                <Suspense fallback={null}>
                  <Photo url={r.image} w={PHOTO.w} h={PHOTO.h} />
                </Suspense>
              )}
            </group>
          </group>
        );
      })}
      <Signboard text={`${bay.category} · ${n}`} width={Math.min(3.4, Math.max(2.2, length - 0.4))} height={0.8} position={[0, 5.75, -WALL_BEHIND + 0.1]} />
      {[-1, 1].map((s) => (
        <PaperLantern key={s} position={[s * (length / 2 + 0.2), 5.2, -WALL_BEHIND + 0.9]} size={0.9} />
      ))}
      <pointLight position={[0, 4.6, 1.2]} color="#ffc878" intensity={30} distance={12} decay={1.6} />
      <GlowPool position={[0, 0.14, 0.9]} size={Math.max(4, length + 1)} color="#ffc24a" opacity={0.14} />
    </group>
  );
}

/** 맨 안쪽 벽: 금 원판과 메달 합계 */
function TotalsWall({ z, gold, silver, bronze }: { z: number; gold: number; silver: number; bronze: number }) {
  const text = [`금 ${gold}`, `은 ${silver}`, bronze ? `동 ${bronze}` : null].filter(Boolean).join(' · ');
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.5, 1.2]}>
        <boxGeometry args={[9, 1, 3]} />
        <meshStandardMaterial color="#17100f" roughness={0.35} metalness={0.2} />
      </mesh>
      <Trophy medal="gold" position={[0, 1, 1.2]} scale={2.6} />
      {([['silver', -2.6], ['silver', 2.6]] as [Medal, number][]).map(([m, x]) => (
        <Trophy key={x} medal={m} position={[x, 1, 1.4]} scale={1.7} />
      ))}
      <mesh position={[0, 7.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.14, 48]} />
        <meshStandardMaterial color="#d9a520" emissive="#d49a10" emissiveIntensity={0.55} metalness={0.4} roughness={0.3} />
      </mesh>
      <Label text={text} width={7.5} height={1.1} color="#ffe08a" glow={2} position={[0, 4.9, 0.3]} />
      <Label text="RECORD OF GLORY" width={5} height={0.42} color="#c9a04a" glow={1.3} position={[0, 4.05, 0.3]} />
      <pointLight position={[0, 4, 5]} color="#ffd070" intensity={55} distance={22} decay={1.6} />
    </group>
  );
}

interface HistoryHallSceneProps {
  records: HallRecord[];
  /** 멤버 이름 → 색·아바타 (없는 멤버는 이름만 보여 준다) */
  memberProfiles: HistoryMemberProfileMap;
  low: boolean;
}

export default function HistoryHallScene({ records, memberProfiles, low }: HistoryHallSceneProps) {
  const { placed, endZ: rowsEnd } = useMemo(() => placeBays(groupByCategory(records), FIRST_Z), [records]);
  const totals = useMemo(() => medalTotals(records), [records]);
  const endZ = rowsEnd - 4;
  // 정보 카드는 한 번에 하나: 마우스를 올린 전시대가 먼저, 없으면 보는 위치에서 가장 가까운 전시대
  const spots = useMemo(() => exhibitSpots(placed, EXHIBIT_X), [placed]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [nearId, setNearId] = useState<string | null>(null);
  useFrame(({ camera }) => {
    const id = nearestExhibit(spots, camera.position.x, camera.position.z, NEAR_RADIUS);
    if (id !== nearId) setNearId(id);
  });
  const activeId = hoverId ?? nearId;
  const length = 8 - endZ;
  const zc = (8 + endZ) / 2;
  const floor = useMemo(
    () =>
      canvasTexture(
        128,
        (g, n) => {
          g.fillStyle = '#1b1112';
          g.fillRect(0, 0, n, n);
          g.strokeStyle = 'rgba(255,200,120,0.07)';
          for (let i = 0; i < n; i += 16) {
            g.beginPath();
            g.moveTo(i, 0);
            g.lineTo(i, n);
            g.stroke();
          }
        },
        [HALF_W / 2, length / 4],
      ),
    [length],
  );
  const pillarZ = useMemo(() => Array.from({ length: Math.max(2, Math.round((2 - endZ) / PILLAR_GAP)) }, (_, i) => 2 - i * PILLAR_GAP), [endZ]);
  return (
    <group>
      <ambientLight intensity={0.28} color="#ffcf9a" />
      <hemisphereLight args={['#ffc98a', '#120806', 0.35]} />
      {/* 바닥·벽·천장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]}>
        <planeGeometry args={[HALF_W * 2, length]} />
        <meshStandardMaterial map={floor} roughness={0.25} metalness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * HALF_W, CEILING / 2, zc]}>
          <boxGeometry args={[0.4, CEILING, length]} />
          <meshStandardMaterial color="#1d1114" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, CEILING / 2, endZ - 0.2]}>
        <boxGeometry args={[HALF_W * 2, CEILING, 0.4]} />
        <meshStandardMaterial color="#231316" roughness={0.85} />
      </mesh>
      <mesh position={[0, CEILING + 0.2, zc]}>
        <boxGeometry args={[HALF_W * 2, 0.4, length]} />
        <meshStandardMaterial color="#120b0c" roughness={0.9} />
      </mesh>
      {/* 붉은 융단과 금 테 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, zc]}>
        <planeGeometry args={[AISLE * 2, length - 1]} />
        <meshStandardMaterial color="#7a1410" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * AISLE, 0.03, zc]}>
          <boxGeometry args={[0.08, 0.04, length - 1]} />
          <meshBasicMaterial color={new THREE.Color('#ffcf60').multiplyScalar(1.3)} />
        </mesh>
      ))}
      {/* 붉은 기둥, 들보, 통로 위 등 */}
      {pillarZ.map((z) => (
        <group key={z} position={[0, 0, z]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * PILLAR_X, 0, 0]}>
              <mesh position={[0, CEILING / 2, 0]}>
                <cylinderGeometry args={[0.34, 0.4, CEILING, 14]} />
                <meshStandardMaterial color="#8f1d14" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[1, 0.6, 1]} />
                <meshStandardMaterial color="#2b2327" roughness={0.8} />
              </mesh>
              <mesh position={[0, CEILING - 0.9, 0]}>
                <boxGeometry args={[0.9, 0.3, 0.9]} />
                <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, CEILING - 0.45, 0]}>
            <boxGeometry args={[HALF_W * 2, 0.5, 0.6]} />
            <meshStandardMaterial color="#5a120d" roughness={0.6} />
          </mesh>
          <PaperLantern position={[0, CEILING - 1.5, 0]} size={1.5} glow={2} />
          <GlowPool position={[0, 0.04, 0]} size={6} color="#ffb060" opacity={0.3} />
        </group>
      ))}
      {placed.map((b) => (
        <CategoryRow key={b.category} bay={b} activeId={activeId} profiles={memberProfiles} onHover={setHoverId} />
      ))}
      <TotalsWall z={endZ} {...totals} />
      <pointLight position={[0, 7, zc] as Vec3} color="#ffb870" intensity={160} distance={60} decay={1.7} />
      <Embers count={low ? 80 : 200} seed={63} bounds={[-10, 10, 0, 8, endZ, 6]} color="#ffcf7a" size={0.06} rise={0.1} opacity={0.6} />
    </group>
  );
}
