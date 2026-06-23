import type { CSSProperties } from 'react';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import { getMemberRankLabel } from './memberPresentation';

interface MemberModalProps {
  member: Member;
  onClose: () => void;
}

function splitHashTags(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function MemberModal({ member, onClose }: MemberModalProps) {
  const soopAccount = member.platformAccounts.find(
    (account) => account.platform.code === 'SOOP',
  );
  const summary = member.description?.split('\n')[0] ?? '';
  const hashTags = splitHashTags(member.hashTag);
  const color = getMemberColor(member);
  const rankLabel = getMemberRankLabel(member);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
    >
      <div
        className="member-modal-content"
        onClick={(event) => event.stopPropagation()}
        style={{ '--member-color': color } as CSSProperties}
      >
        <button
          className="member-modal-close"
          onClick={onClose}
          aria-label="멤버 상세 닫기"
        >
          ×
        </button>

        <div className="member-modal-layout">
          <div className="member-modal-left">
            {member.profileAsset?.publicUrl && (
              <img src={member.profileAsset.publicUrl} alt={member.stageName} />
            )}
          </div>

          <div className="member-modal-right">
            <div className="member-modal-rank" style={{ color }}>
              {rankLabel}
            </div>
            <h2 id="member-modal-title" style={{ textShadow: `0 0 30px ${color}80` }}>
              {member.stageName}
            </h2>
            {hashTags.length > 0 && (
              <div className="member-modal-keywords">{hashTags.join(' ')}</div>
            )}

            <div className="member-modal-divider" style={{ background: color }} />

            <div className="member-modal-meta">
              {member.birth && (
                <div className="member-modal-meta-item">
                  <span>Birth</span>
                  <strong>{member.birth}</strong>
                </div>
              )}
              {member.mbti && (
                <div className="member-modal-meta-item">
                  <span>MBTI</span>
                  <strong>{member.mbti}</strong>
                </div>
              )}
              {member.personalColor && (
                <div className="member-modal-meta-item">
                  <span>Color</span>
                  <strong>{member.personalColor}</strong>
                </div>
              )}
            </div>

            {summary && <p className="member-modal-summary">{summary}</p>}

            {member.title && (
              <div className="member-modal-desc">
                <strong>혈귀술</strong>
                <span>{member.title}</span>
              </div>
            )}

            {member.tmi && (
              <div
                className="member-modal-tmi"
                style={{
                  borderLeftColor: color,
                  background: `linear-gradient(to right, ${color}11, transparent)`,
                }}
              >
                <span style={{ color }}>TMI / 특이사항</span>
                <p>{member.tmi}</p>
              </div>
            )}

            {soopAccount?.channelUrl && (
              <a
                href={soopAccount.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="member-modal-visit"
                style={{ border: `2px ${color}` }}
              >
                SOOP STATION
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
