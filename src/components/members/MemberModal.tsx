import type { Member } from '../../api/types';

interface MemberModalProps {
  member: Member;
  onClose: () => void;
}

export default function MemberModal({ member, onClose }: MemberModalProps) {
  const soopAccount = member.platformAccounts.find(
    (account) => account.platform.code === 'SOOP',
  );
  const lines = (member.description ?? '').split('\n').filter(Boolean);
  const description = lines[0] ?? '';
  const tmi = lines[1] ?? '';
  const keywords = lines[2] ?? '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {member.profileAsset?.publicUrl && (
            <img
              src={member.profileAsset.publicUrl}
              alt={member.stageName}
              style={{
                width: 160,
                height: 200,
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: 4,
                border: '1px solid var(--border-red)',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div
              style={{
                fontSize: '0.7rem',
                letterSpacing: 2,
                color: 'var(--bright-rose)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {member.rank?.name}
            </div>
            <h2
              className="gold-text"
              style={{
                fontSize: '1.6rem',
                fontFamily: "'Oswald', sans-serif",
                marginBottom: 6,
              }}
            >
              {member.stageName}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 16, letterSpacing: 1 }}>
              {member.title}
            </div>
            {description && (
              <p style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.6, marginBottom: 12 }}>
                {description}
              </p>
            )}
            {tmi && (
              <p style={{ fontSize: '0.8rem', color: '#999', lineHeight: 1.5, marginBottom: 8 }}>
                {tmi}
              </p>
            )}
            {keywords && (
              <p style={{ fontSize: '0.72rem', color: 'var(--bright-rose)', marginBottom: 16 }}>
                {keywords}
              </p>
            )}
            {soopAccount?.channelUrl && (
              <a
                href={soopAccount.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="premium-view-live-btn"
                style={{ display: 'inline-flex', marginTop: 8 }}
              >
                <span>SOOP 채널 방문 ►</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
