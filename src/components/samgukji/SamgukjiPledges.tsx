import type { CSSProperties } from 'react';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import { PLEDGE_POST_URLS } from './samgukjiData';

interface SamgukjiPledgesProps {
  members: Member[];
}

export default function SamgukjiPledges({ members }: SamgukjiPledgesProps) {
  return (
    <div className="sgj-pledges">
      <h2 className="sgj-panel-title">장수별 공약</h2>
      {members.length === 0 ? (
        <p className="sgj-empty">등록된 장수가 없습니다.</p>
      ) : (
        <div className="sgj-scroll-grid">
          {members.map((member) => (
            <PledgeMemberCard
              key={member.memberId}
              member={member}
              postUrl={PLEDGE_POST_URLS[member.stageName] ?? '#'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PledgeMemberCardProps {
  member: Member;
  postUrl: string;
}

function PledgeMemberCard({ member, postUrl }: PledgeMemberCardProps) {
  const color = getMemberColor(member);
  const photo = member.profileAsset?.publicUrl;

  return (
    <a
      className="sgj-photo-card"
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--sgj-member': color } as CSSProperties}
      aria-label={`${member.stageName} 공약 게시물 보기`}
    >
      {photo ? (
        <img src={photo} alt={member.stageName} loading="lazy" decoding="async" />
      ) : (
        <span className="sgj-photo-fallback" aria-hidden="true">
          {member.stageName.slice(0, 1)}
        </span>
      )}
      <span className="sgj-photo-name">{member.stageName}</span>
    </a>
  );
}
