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
      <div style={{ maxWidth: 1400, margin: '32px auto 100px', padding: '0 5%' }}>
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
        <div
          style={{
            background: 'rgba(15,15,15,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {isLoading && (
            <div style={{ padding: 80, textAlign: 'center', color: '#888' }}>
              무한성 통신망을 통해 일정을 불러오는 중...
            </div>
          )}
          {isError && (
            <div style={{ padding: 80, textAlign: 'center', color: '#e11d48' }}>
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
