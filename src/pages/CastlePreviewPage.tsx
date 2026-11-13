// 개발용 미리보기 (/castle-preview, 개발 서버에서만 열린다): 새 공간의 3D 디자인을 서버 없이 돌려 본다.
// 실제 공간으로 붙이기 전 단계라 캐릭터·충돌·실시간 연결은 없다. 설계: planning/castle/spaces-20261112.md
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { Vector3 } from 'three';
import HistoryHallScene, { HISTORY_HALL_FOG } from '../components/castle/spaces/HistoryHallScene';
import { toHallRecords, type HallRecord } from '../components/castle/spaces/historyHallPresentation';
import PlazaScene, { PLAZA_FOG } from '../components/castle/spaces/PlazaScene';
import type { Vec3 } from '../components/castle/spaces/parts';
import { isLowSpec } from '../castle/quality';
import type { HistoryAchievement } from '../api/types';
import type { MembersGrouped, NoticeStreamer } from '../api/types';
import { buildHistoryMemberProfileMap } from '../components/history/historyPresentation';
import { useHistory, useNotice } from '../hooks/useContent';
import { useMembers } from '../hooks/useMembers';

interface View {
  label: string;
  from: Vec3;
  at: Vec3;
}

const SPACES = {
  plaza: {
    label: '광장',
    fog: PLAZA_FOG,
    views: [
      { label: '전체', from: [0, 26, 44], at: [0, 3, -2] },
      { label: '도착 시점', from: [0, 2.2, 13], at: [0, 5, -10] },
      { label: '전당', from: [0, 5, 2], at: [0, 6, -22] },
      { label: '화랑', from: [2, 4, 4], at: [-22, 3.5, -1] },
      { label: '관람실', from: [-2, 5, 4], at: [24, 6, -1] },
      { label: '화실', from: [-2, 3, 6], at: [-10.5, 2.5, 21] },
      { label: '내려가는 문', from: [-4, 4, 6], at: [4, 2.5, 17] },
    ],
  },
  history: {
    label: 'History 전당 내부',
    fog: HISTORY_HALL_FOG,
    views: [
      { label: '입구', from: [0, 3, 7], at: [0, 3.5, -20] },
      { label: '종목 줄', from: [1.5, 2.8, -1], at: [-7.5, 2.6, -6] },
      { label: '전시대 가까이', from: [-2.4, 2.4, -5.75], at: [-6.3, 2.7, -5.75] },
      { label: '안쪽 합계', from: [0, 3, -17], at: [0, 4, -32] },
      { label: '위에서', from: [0, 8, 6], at: [0, 0, -18] },
    ],
  },
} satisfies Record<string, { label: string; fog: { color: string; density: number }; views: View[] }>;
type SpaceId = keyof typeof SPACES;

/** 로컬 DB에 수상 기록이 없을 때 쓰는 자리 채움. 종목 수와 메달 수만 운영 데이터(금 11·은 8, 7종목)와 맞췄다 */
const SAMPLE_RECORDS: HallRecord[] = (
  [
    ['멀티', 'gold', 3], ['멀티', 'silver', 2], ['기타', 'gold', 3], ['기타', 'silver', 2], ['마인크래프트', 'gold', 2], ['마인크래프트', 'silver', 1],
    ['배그', 'gold', 1], ['배그', 'silver', 1], ['롤', 'gold', 1], ['롤', 'silver', 1], ['크레이지아케이드', 'gold', 1], ['피파', 'silver', 1],
  ] as const
).flatMap(([category, medal, n]) => Array.from({ length: n }, (_, i) => ({ id: `${category}-${medal}-${i}`, title: `대회 ${i + 1}`, category, medal, image: null, date: '', members: [] })));

/** 운영 서버의 공개 API를 읽는다 (읽기 전용, vite.config.ts의 /prod-api 프록시) */
async function fetchProd<T>(path: string): Promise<T> {
  const res = await fetch(`/prod-api${path}`);
  if (!res.ok) throw new Error(`prod ${path} ${res.status}`);
  return res.json();
}

/** 운영 서버에서 읽을 때의 공통 옵션 */
const PROD_QUERY = { staleTime: Infinity, retry: false } as const;

/** 고른 시점으로 카메라와 궤도 중심을 옮긴다 */
function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: Vector3; update: () => void } | null;
  useEffect(() => {
    camera.position.set(...view.from);
    if (controls) {
      controls.target.set(...view.at);
      controls.update();
    } else camera.lookAt(...view.at);
  }, [camera, controls, view]);
  return null;
}

export default function CastlePreviewPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [spaceId, setSpaceId] = useState<SpaceId>(query.get('space') === 'history' ? 'history' : 'plaza');
  const [viewIndex, setViewIndex] = useState(Number(query.get('view')) || 0);
  const low = useMemo(() => isLowSpec(), []);
  // 기록 출처: 로컬 서버 → (비어 있으면) 운영 서버 읽기 → (그것도 안 되면) 자리 채움
  const local = useHistory();
  const prod = useQuery({ queryKey: ['castle-preview', 'prod-history'], queryFn: () => fetchProd<HistoryAchievement[]>('/history'), ...PROD_QUERY });
  const fromLocal = useMemo(() => toHallRecords(local.data ?? []), [local.data]);
  const fromProd = useMemo(() => toHallRecords(prod.data ?? []), [prod.data]);
  const source = fromLocal.length ? 'local' : fromProd.length ? 'prod' : 'sample';
  const records = source === 'local' ? fromLocal : source === 'prod' ? fromProd : SAMPLE_RECORDS;
  // 멤버 색·아바타도 기록과 같은 출처에서 (운영 기록에는 운영 멤버 이름이 들어 있다)
  const fromProdSource = source === 'prod';
  const localMembers = useMembers();
  const localNotice = useNotice();
  const prodMembers = useQuery({ queryKey: ['castle-preview', 'prod-members'], queryFn: () => fetchProd<MembersGrouped>('/members'), enabled: fromProdSource, ...PROD_QUERY });
  const prodNotice = useQuery({ queryKey: ['castle-preview', 'prod-notice'], queryFn: () => fetchProd<NoticeStreamer[]>('/notice'), enabled: fromProdSource, ...PROD_QUERY });
  const memberProfiles = useMemo(
    () => buildHistoryMemberProfileMap((fromProdSource ? prodMembers : localMembers).data, (fromProdSource ? prodNotice : localNotice).data ?? []),
    [fromProdSource, prodMembers.data, localMembers.data, prodNotice.data, localNotice.data],
  );
  const space = SPACES[spaceId];
  const view = space.views[viewIndex] ?? space.views[0];

  return (
    <div className="fixed inset-0 bg-black font-['Noto_Serif_KR',serif] text-sm text-neutral-200 select-none">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 50, near: 0.1, far: 600 }} gl={{ antialias: false }}>
        <color attach="background" args={[space.fog.color]} />
        <fogExp2 attach="fog" args={[space.fog.color, space.fog.density]} />
        {spaceId === 'plaza' ? <PlazaScene low={low} /> : <HistoryHallScene records={records} memberProfiles={memberProfiles} low={low} />}
        <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI * 0.55} />
        <CameraRig view={view} />
        <EffectComposer multisampling={low ? 0 : 4}>
          <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <div className="absolute top-4 left-4 space-y-2">
        <p className="text-xs text-neutral-400">공간 디자인 미리보기 (개발용) · 끌어서 돌리기, 휠로 확대</p>
        <div className="flex gap-2">
          {(Object.keys(SPACES) as SpaceId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSpaceId(id);
                setViewIndex(0);
              }}
              className={`border px-3 py-1 ${id === spaceId ? 'border-amber-400 text-amber-300' : 'border-neutral-600 hover:border-neutral-400'}`}
            >
              {SPACES[id].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {space.views.map((v, i) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setViewIndex(i)}
              className={`border px-2 py-0.5 text-xs ${v === view ? 'border-amber-400/70 text-amber-200' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {spaceId === 'history' && (
          <p className="text-xs text-neutral-500">
            {source === 'local' && `수상 기록 ${records.length}건: 로컬 서버`}
            {source === 'prod' && `수상 기록 ${records.length}건: 운영 서버(읽기 전용)`}
            {source === 'sample' && '수상 기록을 읽지 못해 자리 채움 데이터로 보여 줍니다(종목·메달 수만 실제와 같음).'}
          </p>
        )}
      </div>
    </div>
  );
}
