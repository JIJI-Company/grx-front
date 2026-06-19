import { useEffect, useState } from 'react';
import type { Member } from '../api/types';
import { LoadingState } from '../components/common/AsyncState';
import MemberModal from '../components/members/MemberModal';
import MemberRankSection from '../components/members/MemberRankSection';
import { useMembers } from '../hooks/useMembers';

export default function MembersPage() {
  const { data, isLoading } = useMembers();
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    document.body.classList.add('members-route');
    return () => document.body.classList.remove('members-route');
  }, []);

  if (isLoading) {
    return (
      <div className="members-page-wrap">
        <LoadingState message="무한성 멤버 정보 수신 중..." />
      </div>
    );
  }

  return (
    <div className="members-page-wrap">
      <MemberRankSection
        title="THE MASTER"
        members={data?.master ?? []}
        isMaster
        onSelect={setSelected}
      />
      <MemberRankSection
        title="상현"
        members={data?.upper ?? []}
        onSelect={setSelected}
      />
      <MemberRankSection
        title="하현"
        members={data?.lower ?? []}
        onSelect={setSelected}
      />
      <MemberRankSection
        title="NEW"
        members={data?.new ?? []}
        onSelect={setSelected}
      />
      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
