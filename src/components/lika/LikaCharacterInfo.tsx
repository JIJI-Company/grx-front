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
    <div className="glass-panel mb-10 rounded-panel p-5 sm:p-7">
      <h2 className="section-title mb-4">CHARACTER INFO</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-sm bg-white/3 px-4 py-3"
          >
            <div className="mb-1 text-[0.65rem] tracking-[0.2em] text-ruby-600 uppercase">
              {label}
            </div>
            <div className="text-sm font-bold">{value}</div>
          </div>
        ))}
      </div>
      {member.description && (
        <div className="mt-4">
          {member.description.split('\n').filter(Boolean).map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={`mb-1 text-sm leading-relaxed ${
                index === 0 ? 'text-ink-200' : 'text-ink-400'
              }`}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
