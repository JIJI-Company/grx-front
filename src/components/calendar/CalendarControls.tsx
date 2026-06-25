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
    <section className="calendar-hero">
      <h1 className="cal-title-main">CALENDAR</h1>
    </section>
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
    <div className="cal-header">
      <div className="cal-nav">
        <h2 className="cal-current-date">
          {headerLabel}
        </h2>
        <div className="cal-toggle-group">
          {[-1, 1].map((direction) => (
            <button
              key={direction}
              onClick={() => onNavigate(direction)}
              className="cal-nav-btn"
              aria-label={direction < 0 ? '이전 기간' : '다음 기간'}
            >
              {direction < 0 ? '◀' : '▶'}
            </button>
          ))}
        </div>
      </div>
      <div className="cal-controls">
        <div className="cal-toggle-group">
          {(['month', 'week'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`cal-toggle-btn ${viewMode === mode ? 'active' : ''}`}
            >
              {mode === 'month' ? '월간' : '주간'}
            </button>
          ))}
        </div>
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
    <div className="no-scrollbar mb-5 flex justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
      {['ALL', ...members].map((member) => (
        <button
          key={member}
          onClick={() => onSelect(member)}
          className={`focus-ring shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
            selectedMember === member
              ? 'border-ruby-600 bg-ruby-600 text-white'
              : 'border-white/10 bg-white/5 text-ink-300 hover:border-ruby-600/40 hover:text-white'
          }`}
        >
          {member}
        </button>
      ))}
    </div>
  );
}
