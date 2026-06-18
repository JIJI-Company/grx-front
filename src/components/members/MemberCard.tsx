import type { Member } from '../../api/types';

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

  return (
    <div className="member-card-wrap" onClick={onClick}>
      <div className="flip-card">
        <div className="flip-front">
          {member.profileAsset?.publicUrl && (
            <img src={member.profileAsset.publicUrl} alt={member.stageName} />
          )}
          <div className="rank-overlay">{member.rank?.name}</div>
          <div className="info">
            <h3 className={isGold ? 'gold-text' : ''}>{member.stageName}</h3>
            <span className="blood-art">{member.title}</span>
          </div>
        </div>
        <div className="flip-back">
          <h3 className="gold-text">{member.stageName}</h3>
          <div className="back-keywords" style={{ fontSize: '0.75rem', margin: '8px 0' }}>
            {descriptionLines[2] ?? ''}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
            {descriptionLines[0] ?? ''}
          </p>
          <span className="click-hint">CLICK FOR RECORD</span>
        </div>
      </div>
    </div>
  );
}
