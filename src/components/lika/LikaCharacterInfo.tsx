import type { Member } from '../../api/types';

interface LikaCharacterInfoProps {
  member: Member;
}

export default function LikaCharacterInfo({ member }: LikaCharacterInfoProps) {
  const fields = [
    { label: 'RANK', value: member.rank?.name ?? '' },
    { label: 'TITLE', value: member.title ?? '' },
  ];

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 8,
        padding: 28,
        marginBottom: 40,
      }}
    >
      <h2 className="section-title" style={{ marginBottom: 16 }}>CHARACTER INFO</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {fields.map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: 3,
                color: 'var(--bright-rose)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
          </div>
        ))}
      </div>
      {member.description && (
        <div style={{ marginTop: 16 }}>
          {member.description.split('\n').filter(Boolean).map((line, index) => (
            <p
              key={`${line}-${index}`}
              style={{
                fontSize: '0.85rem',
                color: index === 0 ? '#ccc' : '#888',
                lineHeight: 1.6,
                marginBottom: 4,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
