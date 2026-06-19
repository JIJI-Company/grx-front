import { useCallback, useMemo, useState } from 'react';
import type { CalendarEvent } from '../api/types';
import {
  CalendarControls,
  CalendarHero,
  type CalendarViewMode,
  MemberFilters,
} from '../components/calendar/CalendarControls';
import { DayModal, EventModal } from '../components/calendar/CalendarModals';
import { MonthView, WeekView } from '../components/calendar/CalendarViews';
import { buildScheduleMap } from '../components/calendar/calendarUtils';
import { useCalendar } from '../hooks/useCalendar';

export default function CalendarPage() {
  const { data: events = [], isLoading, isError } = useCalendar();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [current, setCurrent] = useState(() => new Date());
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dayModalState, setDayModalState] = useState<{
    date: Date;
    events: CalendarEvent[];
  } | null>(null);

  const allMembers = useMemo(() => {
    const members = new Set<string>();
    events.forEach((event) => event.members.forEach((member) => members.add(member)));
    return Array.from(members).sort();
  }, [events]);

  const scheduleMap = useMemo(
    () => buildScheduleMap(events, memberFilter),
    [events, memberFilter],
  );

  const navigate = useCallback((direction: number) => {
    setCurrent((previous) => {
      const next = new Date(previous);

      if (viewMode === 'month') {
        next.setMonth(previous.getMonth() + direction);
      } else {
        next.setDate(previous.getDate() + direction * 7);
      }

      return next;
    });
  }, [viewMode]);

  const openDayModal = (date: Date, dayEvents: CalendarEvent[]) => {
    setDayModalState({ date, events: dayEvents });
  };

  return (
    <div>
      <CalendarHero />
      <div className="calendar-shell mt-8 mb-24">
        <CalendarControls
          current={current}
          viewMode={viewMode}
          onNavigate={navigate}
          onViewModeChange={setViewMode}
        />
        <MemberFilters
          members={allMembers}
          selectedMember={memberFilter}
          onSelect={setMemberFilter}
        />
        <div className="glass-panel no-scrollbar overflow-x-auto rounded-2xl border-white/10">
          <div className="min-w-[44rem]">
            {isLoading && (
              <div className="px-6 py-20 text-center text-ink-400">
                무한성 통신망을 통해 일정을 불러오는 중...
              </div>
            )}
            {isError && (
              <div className="px-6 py-20 text-center text-ruby-600">
                일정 데이터 로드에 실패했습니다.
              </div>
            )}
            {!isLoading && !isError && viewMode === 'month' && (
              <MonthView
                current={current}
                scheduleMap={scheduleMap}
                onDayClick={openDayModal}
                onEventClick={setSelectedEvent}
              />
            )}
            {!isLoading && !isError && viewMode === 'week' && (
              <WeekView
                current={current}
                scheduleMap={scheduleMap}
                onDayClick={openDayModal}
                onEventClick={setSelectedEvent}
              />
            )}
          </div>
        </div>
      </div>

      {dayModalState && (
        <DayModal
          date={dayModalState.date}
          events={dayModalState.events}
          onClose={() => setDayModalState(null)}
          onEvent={(event) => {
            setDayModalState(null);
            setSelectedEvent(event);
          }}
        />
      )}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
