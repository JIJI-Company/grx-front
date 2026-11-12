// 개발용 시험 페이지 (/soop-test, 개발 서버에서만 열린다): SOOP 방송을 사이트 안에 넣었을 때
// 재생·화질(1080p)이 어떻게 되는지 직접 확인한다. 관람실 설계(planning/castle/spaces-20261112.md §4-4)의 사전 확인용.
import { useState } from 'react';
import { useLiveStatus } from '../hooks/useLive';

/** 방송국 주소(https://www.sooplive.com/station/{id})에서 SOOP 아이디만 뽑는다 */
function soopIdOf(channelUrl: string | null): string | null {
  return channelUrl?.match(/sooplive\.com\/(?:station\/)?([\w-]+)\/?$/)?.[1] ?? null;
}

const CHECKS = [
  '방송이 재생되는가 (광고가 먼저 나올 수 있음)',
  '플레이어 설정(톱니바퀴) → 화질에서 1080p를 고르면 1080p로 유지되는가, 다른 화질로 돌아가는가',
  '"고화질 스트리머" 설치·권한 안내 창이 뜨는가',
  '전체 화면이 되는가',
];

export default function SoopEmbedTestPage() {
  const live = useLiveStatus();
  const [draft, setDraft] = useState('');
  const [soopId, setSoopId] = useState<string | null>(null);
  const members = (live.data ?? []).flatMap((m) => {
    const id = soopIdOf(m.channelUrl);
    return id ? [{ id, name: m.memberName ?? id, isLive: m.isLive }] : [];
  });

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-sm text-neutral-200">
      <h1 className="text-lg font-semibold">SOOP 임베드 시험 (개발용)</h1>
      <p className="mt-1 text-neutral-400">방송 중인 채널을 골라 아래 항목을 확인한다. 방송 중이 아니면 플레이어에 방송 종료 화면이 나온다.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSoopId(m.id)}
            className={`rounded border px-3 py-1 ${soopId === m.id ? 'border-amber-400 text-amber-300' : 'border-neutral-700 hover:border-neutral-500'}`}
          >
            {m.name}
            {m.isLive && <span className="ml-1 text-red-400">● 방송 중</span>}
          </button>
        ))}
        {live.isError && <span className="text-red-400">멤버 목록을 불러오지 못했습니다. 아이디를 직접 입력하세요.</span>}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) setSoopId(draft.trim());
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="다른 SOOP 아이디 직접 입력"
          aria-label="SOOP 아이디"
          className="w-64 rounded border border-neutral-700 bg-neutral-900 px-3 py-1"
        />
        <button type="submit" className="rounded border border-neutral-700 px-3 py-1 hover:border-neutral-500">
          열기
        </button>
      </form>

      <div className="mt-4 aspect-video w-full max-w-[1280px] border border-neutral-800 bg-black">
        {soopId ? (
          <iframe
            key={soopId}
            title={`SOOP ${soopId}`}
            src={`https://play.sooplive.com/${encodeURIComponent(soopId)}/embed`}
            // local-network-access 계열: 고화질 스트리머(시청자 PC의 프로그램)와의 연결 권한을 iframe에 넘긴다.
            // 크롬은 다른 사이트의 iframe에는 이 권한을 기본으로 막는다 (이름이 버전에 따라 달라 셋 다 적는다)
            allow="autoplay; fullscreen; encrypted-media; local-network-access; local-network; loopback-network"
            allowFullScreen
            className="size-full"
          />
        ) : (
          <p className="grid size-full place-items-center text-neutral-500">위에서 채널을 고르세요</p>
        )}
      </div>

      <h2 className="mt-5 font-semibold">확인할 것</h2>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-neutral-300">
        {CHECKS.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <p className="mt-3 text-neutral-500">
        플레이어 창 크기: 최대 1280×720. 같은 방송을 sooplive.com에서 직접 열었을 때와 화질이 같은지도 비교하면 좋다.
      </p>
    </div>
  );
}
