import type { Member } from '../../api/types';
import MemberCard from './MemberCard';

interface MemberRankSectionProps {
  title: string;
  members: Member[];
  isMaster?: boolean;
  onSelect: (member: Member) => void;
}

export default function MemberRankSection({
  title,
  members,
  isMaster = false,
  onSelect,
}: MemberRankSectionProps) {
  if (members.length === 0) return null;

  if (isMaster) {
    return (
      <>
        <h2 className="rank-title">{title}</h2>
        <div className="master-container">
          {members.map((member) => (
            <div
              key={member.memberId}
              className="master-container"
              style={{ maxWidth: 240, width: '100%' }}
            >
              <MemberCard member={member} isGold onClick={() => onSelect(member)} />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="rank-title">{title}</h2>
      <div className="members-grid">
        {members.map((member) => (
          <MemberCard
            key={member.memberId}
            member={member}
            onClick={() => onSelect(member)}
          />
        ))}
      </div>
    </>
  );
}
