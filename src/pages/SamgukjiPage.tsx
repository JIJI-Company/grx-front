import { useEffect, useMemo, useState } from 'react';
import { LoadingState } from '../components/common/AsyncState';
import SamgukjiStatus from '../components/samgukji/SamgukjiStatus';
import SamgukjiPledges from '../components/samgukji/SamgukjiPledges';
import MemberPledgeModal from '../components/samgukji/MemberPledgeModal';
import { PLEDGES } from '../components/samgukji/samgukjiData';
import {
  flattenMembers,
  groupPledgesByMember,
  indexMembersByName,
  selectSamgukjiMembers,
} from '../components/samgukji/samgukjiPresentation';
import { useMembers } from '../hooks/useMembers';

type SamgukjiTab = 'status' | 'pledges';

const TABS: Array<{ id: SamgukjiTab; label: string }> = [
  { id: 'status', label: '현황' },
  { id: 'pledges', label: '장수별 공약' },
];

export default function SamgukjiPage() {
  const { data, isLoading } = useMembers();
  const [tab, setTab] = useState<SamgukjiTab>('status');
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('samgukji-route');
    return () => document.body.classList.remove('samgukji-route');
  }, []);

  const members = useMemo(() => selectSamgukjiMembers(flattenMembers(data)), [data]);
  const membersByName = useMemo(() => indexMembersByName(members), [members]);
  const pledgesByMember = useMemo(() => groupPledgesByMember(PLEDGES), []);

  const selectedMember = selectedName ? membersByName.get(selectedName) : undefined;
  const selectedPledges = selectedName ? pledgesByMember.get(selectedName) ?? [] : [];
  const selectedChannel =
    selectedMember?.platformAccounts.find((a) => a.platform.code === 'SOOP')?.channelUrl ?? null;

  return (
    <div className="page-wrap sgj-root">
      <header className="sgj-hero text-center">
        <span className="sgj-hero-eyebrow">三國志 · 공약 대전</span>
        <h1 className="sgj-hero-title sgj-brush">삼국지</h1>
        <p className="sgj-hero-sub">지-캐슬 장수들의 공약 진군을 기록하다</p>
      </header>

      <nav className="sgj-tabs" aria-label="삼국지 화면 전환">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`sgj-tab${tab === id ? ' is-active' : ''}`}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <LoadingState message="장수 명부를 불러오는 중..." />
      ) : tab === 'status' ? (
        <SamgukjiStatus members={members} onSelectMember={setSelectedName} />
      ) : (
        <SamgukjiPledges members={members} />
      )}

      {selectedName && (
        <MemberPledgeModal
          memberName={selectedName}
          member={selectedMember}
          pledges={selectedPledges}
          channelUrl={selectedChannel}
          onClose={() => setSelectedName(null)}
        />
      )}
    </div>
  );
}
