import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import { getMemberRankLabel } from './memberPresentation';

interface MemberCardProps {
  member: Member;
  isGold?: boolean;
  onClick: () => void;
}

export default function MemberCard({
  member,
  isGold = false,
  onClick,
}: MemberCardProps) {
  const descriptionLines = (member.description ?? '').split('\n');
  const summary = member.description?.split('\n')[0] ?? '';
  const tmi = member.tmi ?? descriptionLines[1] ?? '';
  const hashTag = member.hashTag ?? descriptionLines[2] ?? '';
  const color = getMemberColor(member);
  const rankLabel = getMemberRankLabel(member);

  return (
    <div
      className="member-card-wrap"
      onClick={onClick}
      style={{ '--member-color': color } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`${member.stageName} 상세 정보 보기`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flip-card">
        <div className="flip-front">
          <div className="member-portrait">
            {member.profileAsset?.publicUrl && (
              <img src={member.profileAsset.publicUrl} alt={member.stageName} loading="lazy" decoding="async" />
            )}
          </div>
          <div className="info">
            <h3 style={{ color }}>{member.stageName}</h3>
            <span className="blood-art">{member.title}</span>
          </div>
        </div>
        <div className="flip-back">
          <h3 style={{ color }}>{member.stageName}</h3>
          <div className="back-keywords my-2 text-xs">
            {hashTag}
          </div>
          <p className="text-xs leading-snug text-ink-300">
            {summary}
          </p>
          {tmi && <p className="mt-2 text-xs leading-snug text-ink-400">{tmi}</p>}
          <span className="click-hint">CLICK FOR RECORD</span>
        </div>
      </div>
    </div>
  );
}
