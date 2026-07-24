import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import type { ResolvedPledge } from './samgukjiData';
import { formatPledgeTarget, getPledgeStatusMeta } from './samgukjiPresentation';

interface MemberPledgeModalProps {
  memberName: string;
  member: Member | undefined;
  pledges: ResolvedPledge[];
  channelUrl: string | null;
  onClose: () => void;
}

export default function MemberPledgeModal({
  memberName,
  member,
  pledges,
  channelUrl,
  onClose,
}: MemberPledgeModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const color = member ? getMemberColor(member) : '#b32024';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="samgukji-modal-title"
    >
      <div
        className="sgj-modal"
        onClick={(event) => event.stopPropagation()}
        style={{ '--sgj-member': color } as CSSProperties}
      >
        <button className="sgj-modal-close" onClick={onClose} aria-label="공약 상세 닫기">
          ×
        </button>

        <header className="sgj-modal-head">
          {member?.profileAsset?.publicUrl && (
            <img
              className="sgj-modal-avatar"
              src={member.profileAsset.publicUrl}
              alt={memberName}
              loading="eager"
              decoding="async"
            />
          )}
          <div>
            <span className="sgj-modal-eyebrow">장수 공약첩</span>
            <h2 id="samgukji-modal-title">{memberName}</h2>
          </div>
          <span className="sgj-modal-count">목표 {pledges.length}개</span>
        </header>

        <div className="sgj-modal-body">
          <section className="sgj-modal-section">
            <div className="sgj-section-head">
              <span className="sgj-seal" style={{ borderColor: '#c9a24b', color: '#c9a24b' }}>
                累
              </span>
              <h3>누적 공약</h3>
            </div>
            {pledges.length === 0 ? (
              <p className="sgj-modal-empty">아직 새겨진 공약이 없습니다.</p>
            ) : (
              <ul className="sgj-pledge-list">
                {pledges.map((pledge) => {
                  const status = getPledgeStatusMeta(pledge.status);
                  return (
                    <li key={pledge.id} className="sgj-pledge-row">
                      <div className="sgj-pledge-target">
                        <strong>{formatPledgeTarget(pledge.targetCount)}</strong>
                      </div>
                      <div className="sgj-pledge-content">
                        <div className="sgj-pledge-row-top">
                          <strong>{pledge.title}</strong>
                          <span className={`sgj-badge sgj-badge-${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        {pledge.detail && <p>{pledge.detail}</p>}
                        {pledge.achievedAt && (
                          <span className="sgj-pledge-date">달성 {pledge.achievedAt}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {channelUrl && (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sgj-modal-cta"
          >
            응원하러 가기
          </a>
        )}
      </div>
    </div>
  );
}
