// /castle — 무한성 실시간 공간. 라우터에서 lazy-load되어 three.js 번들이 다른 페이지에 섞이지 않는다.
import { useEffect, useState } from 'react';
import CastleGame from '../components/castle/CastleGame';
import { joinRejectionLabel } from '../components/castle/castlePresentation';
import EntryScreen from '../components/castle/ui/EntryScreen';
import { clearEntry, loadEntry, saveEntry } from '../castle/entry';
import { CastleSession, type JoinProfile } from '../castle/session';
import { useCastleStore } from '../castle/store';
import { useCastleStatues } from '../hooks/useCastle';
import { trackPageView } from '../utils/analytics';

export default function CastlePage() {
  // 새로고침이면 기억해 둔 입장 정보로 바로 다시 들어간다
  const [session, setSession] = useState<CastleSession | null>(() => {
    const saved = loadEntry();
    return saved ? new CastleSession(saved) : null;
  });
  const [rejection, setRejection] = useState<{ message: string; profile: JoinProfile } | null>(null);
  const statues = useCastleStatues();

  // Layout 밖 라우트라 page_view를 직접 보낸다
  useEffect(() => trackPageView('/castle'), []);

  useEffect(() => {
    if (!session) return undefined;
    session.start();
    return () => session.stop();
  }, [session]);

  // 첫 입장이 거절되면(닉네임 금칙어·정원 초과) 입장 화면으로 돌아가 이유를 보여 준다
  const store = session?.store ?? null;
  useCastleStore(store);
  const rejectedCode = store?.joinRejection ?? null;
  useEffect(() => {
    if (!session || !rejectedCode) return;
    clearEntry();
    setRejection({ message: joinRejectionLabel(rejectedCode), profile: session.profile });
    setSession(null);
  }, [session, rejectedCode]);

  const enter = (profile: JoinProfile) => {
    setRejection(null);
    saveEntry(profile);
    setSession(new CastleSession(profile));
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-castle-950 font-['Noto_Serif_KR',serif] text-ink-50 select-none">
      {session ? (
        <CastleGame session={session} statues={statues.data ?? []} statuesError={statues.isError} />
      ) : (
        <EntryScreen onEnter={enter} rejection={rejection?.message ?? null} initial={rejection?.profile ?? null} />
      )}
    </div>
  );
}
