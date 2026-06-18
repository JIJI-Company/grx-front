export type CalendarViewMode = 'month' | 'week';

interface CalendarControlsProps {
  current: Date;
  viewMode: CalendarViewMode;
  onNavigate: (direction: number) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

interface MemberFiltersProps {
  members: string[];
  selectedMember: string;
  onSelect: (member: string) => void;
}

export function CalendarHero() {
  return (
    <div
      style={{
        padding: '60px 5% 40px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(225,29,72,0.2)',
        background: 'linear-gradient(to bottom, rgba(5,0,2,0.95), transparent)',
      }}
    >
      <h1
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          color: '#fff',
          fontWeight: 700,
          letterSpacing: 3,
          filter: 'drop-shadow(0 0 30px rgba(225,29,72,0.6))',
          marginBottom: 8,
        }}
      >
        CASTLE CALENDAR
      </h1>
      <p
        style={{
          color: '#e11d48',
          fontSize: '1rem',
          letterSpacing: '0.2rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(225,29,72,0.5)',
        }}
      >
        INFINITE SCHEDULE · GGU-CASTLE
      </p>
    </div>
  );
}

export function CalendarControls({
  current,
  viewMode,
  onNavigate,
  onViewModeChange,
}: CalendarControlsProps) {
  const headerLabel = `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#fff',
            margin: 0,
          }}
        >
          {headerLabel}
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {[-1, 1].map((direction) => (
            <button
              key={direction}
              onClick={() => onNavigate(direction)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {direction < 0 ? '‹' : '›'}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          padding: 4,
          borderRadius: 8,
          gap: 4,
        }}
      >
        {(['month', 'week'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            style={{
              background: viewMode === mode ? '#fff' : 'transparent',
              color: viewMode === mode ? '#000' : '#888',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {mode === 'month' ? '월간' : '주간'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MemberFilters({
  members,
  selectedMember,
  onSelect,
}: MemberFiltersProps) {
  if (members.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
        justifyContent: 'center',
      }}
    >
      {['ALL', ...members].map((member) => (
        <button
          key={member}
          onClick={() => onSelect(member)}
          style={{
            background: selectedMember === member ? '#e11d48' : 'rgba(255,255,255,0.05)',
            color: selectedMember === member ? '#fff' : '#aaa',
            border: `1px solid ${
              selectedMember === member ? '#e11d48' : 'rgba(255,255,255,0.1)'
            }`,
            padding: '6px 14px',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {member}
        </button>
      ))}
    </div>
  );
}
