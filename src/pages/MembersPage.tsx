import { useEffect } from 'react';
import { LoadingState } from '../components/common/AsyncState';
import MemberCastleScene from '../components/members/MemberCastleScene';
import { useMembers } from '../hooks/useMembers';

export default function MembersPage() {
  const { data, isLoading } = useMembers();

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
      <MemberCastleScene
        master={data?.master ?? []}
        upper={data?.upper ?? []}
        lower={data?.lower ?? []}
        newMembers={data?.new ?? []}
      />
    </div>
  );
}
