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
    <div className="border-b border-ruby-600/20 bg-linear-to-b from-castle-950/95 to-transparent px-[5%] py-10 text-center sm:pt-15">
      <h1 className="mb-2 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-bold tracking-[0.06em] text-white drop-shadow-[0_0_30px_rgb(225_29_72/0.6)]">
        CASTLE CALENDAR
      </h1>
      <p className="text-sm font-bold tracking-[0.2em] text-ruby-600 uppercase [text-shadow:0_0_10px_rgb(225_29_72/0.5)] sm:text-base">
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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-3xl font-black text-white sm:text-4xl">
          {headerLabel}
        </h2>
        <div className="flex gap-1">
          {[-1, 1].map((direction) => (
            <button
              key={direction}
              onClick={() => onNavigate(direction)}
              className="focus-ring flex size-8 items-center justify-center rounded-panel text-base text-ink-400 transition hover:bg-white/5 hover:text-white"
              aria-label={direction < 0 ? '이전 기간' : '다음 기간'}
            >
              {direction < 0 ? '‹' : '›'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 rounded-panel bg-white/5 p-1">
        {(['month', 'week'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`focus-ring rounded-md px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
              viewMode === mode ? 'bg-white text-black' : 'text-ink-400 hover:text-white'
            }`}
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
