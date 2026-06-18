import type { CalendarEvent } from '../../api/types';
import {
  DAY_OF_WEEK,
  type ScheduleMap,
  formatTime,
  getEventStyle,
  getGreedySlots,
  getWeekDays,
  toDateString,
} from './calendarUtils';

interface CalendarViewProps {
  current: Date;
  scheduleMap: ScheduleMap;
  onDayClick: (date: Date, events: CalendarEvent[]) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const monthEventRowHeight = 22;
const monthDatePadding = 42;
const monthCellMinimumHeight = 80;
const maxVisibleMonthSlots = 2;

export function MonthView({
  current,
  scheduleMap,
  onDayClick,
  onEventClick,
}: CalendarViewProps) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const todayString = toDateString(new Date());
  const cells: Array<{ date: Date; isEmpty: boolean }> = [];
  const previousMonthLastDate = new Date(year, month, 0).getDate();

  for (let index = 0; index < firstDayOfWeek; index++) {
    cells.push({
      date: new Date(
        year,
        month - 1,
        previousMonthLastDate - firstDayOfWeek + 1 + index,
      ),
      isEmpty: true,
    });
  }
  for (let date = 1; date <= lastDate; date++) {
    cells.push({ date: new Date(year, month, date), isEmpty: false });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(year, month + 1, cells.length - firstDayOfWeek - lastDate + 1),
      isEmpty: true,
    });
  }

  return (
    <div>
      <DayOfWeekHeader />
      {Array.from({ length: cells.length / 7 }, (_, weekIndex) => {
        const week = cells.slice(weekIndex * 7, weekIndex * 7 + 7);
        const seenEvents = new Map<string, CalendarEvent>();

        week.forEach((cell) => {
          (scheduleMap[toDateString(cell.date)] ?? []).forEach((event) => {
            seenEvents.set(event.id, event);
          });
        });

        const slottedEvents = getGreedySlots(Array.from(seenEvents.values()), week[0].date);
        const maxSlot = slottedEvents.length > 0
          ? Math.max(...slottedEvents.map((slot) => slot.slotIndex))
          : -1;
        const hasOverflow = maxSlot >= maxVisibleMonthSlots;
        const hiddenPerColumn: Record<number, number> = {};

        slottedEvents.forEach(({ startCol, span, slotIndex }) => {
          if (slotIndex < maxVisibleMonthSlots) return;

          for (let column = startCol; column < startCol + span; column++) {
            hiddenPerColumn[column] = (hiddenPerColumn[column] ?? 0) + 1;
          }
        });

        const visibleRows = hasOverflow ? maxVisibleMonthSlots + 1 : maxSlot + 1;
        const rowHeight = Math.max(
          monthCellMinimumHeight,
          monthDatePadding + visibleRows * monthEventRowHeight + 24,
        );

        return (
          <div
            key={weekIndex}
            style={{
              position: 'relative',
              minHeight: rowHeight,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {week.map((cell) => {
                const key = toDateString(cell.date);
                const dayEvents = scheduleMap[key] ?? [];
                const isToday = key === todayString;
                const dayOfWeek = cell.date.getDay();

                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (dayEvents.length > 0 && !cell.isEmpty) {
                        onDayClick(cell.date, dayEvents);
                      }
                    }}
                    style={{
                      height: '100%',
                      background: cell.isEmpty ? 'rgba(17,17,17,0.4)' : '#111',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      opacity: cell.isEmpty ? 0.5 : 1,
                      cursor: dayEvents.length > 0 && !cell.isEmpty ? 'pointer' : 'default',
                      padding: '6px 8px 0',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(event) => {
                      if (!cell.isEmpty) event.currentTarget.style.background = '#1a0a12';
                    }}
                    onMouseLeave={(event) => {
                      if (!cell.isEmpty) event.currentTarget.style.background = '#111';
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        fontSize: '0.82rem',
                        fontWeight: isToday ? 900 : 400,
                        color: isToday
                          ? '#fff'
                          : dayOfWeek === 0
                            ? '#f87171'
                            : dayOfWeek === 6
                              ? '#60a5fa'
                              : '#ccc',
                        background: isToday ? '#e11d48' : 'transparent',
                      }}
                    >
                      {cell.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridAutoRows: `${monthEventRowHeight}px`,
                gap: '2px 0',
                padding: `${monthDatePadding}px 0 16px`,
                pointerEvents: 'none',
                zIndex: 2,
                boxSizing: 'border-box',
              }}
            >
              {slottedEvents
                .filter(({ slotIndex }) => slotIndex < maxVisibleMonthSlots)
                .map(({ startCol, span, slotIndex, event }) => (
                  <CalendarEventBar
                    key={`${event.id}-w${weekIndex}`}
                    event={event}
                    startCol={startCol}
                    span={span}
                    slotIndex={slotIndex}
                    rowHeight={monthEventRowHeight}
                    onClick={onEventClick}
                  />
                ))}

              {hasOverflow && Object.entries(hiddenPerColumn).map(([columnString, count]) => {
                const column = Number(columnString);
                const day = week[column];
                if (!day) return null;
                const dayEvents = scheduleMap[toDateString(day.date)] ?? [];

                return (
                  <div
                    key={`more-${weekIndex}-${column}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDayClick(day.date, dayEvents);
                    }}
                    style={{
                      gridColumn: `${column + 1} / span 1`,
                      gridRow: maxVisibleMonthSlots + 1,
                      fontSize: '0.68rem',
                      color: '#e11d48',
                      fontWeight: 700,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      padding: '0 6px',
                      lineHeight: `${monthEventRowHeight - 2}px`,
                      userSelect: 'none',
                    }}
                  >
                    +{count}개
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const weekEventRowHeight = 28;
const weekDatePadding = 52;
const weekMinimumHeight = 220;

export function WeekView({
  current,
  scheduleMap,
  onEventClick,
  onDayClick,
}: CalendarViewProps) {
  const days = getWeekDays(current);
  const todayString = toDateString(new Date());
  const seenEvents = new Map<string, CalendarEvent>();

  days.forEach((day) => {
    (scheduleMap[toDateString(day)] ?? []).forEach((event) => {
      seenEvents.set(event.id, event);
    });
  });

  const slottedEvents = getGreedySlots(Array.from(seenEvents.values()), days[0]);
  const maxSlot = slottedEvents.length > 0
    ? Math.max(...slottedEvents.map((slot) => slot.slotIndex))
    : -1;
  const rowHeight = Math.max(
    weekMinimumHeight,
    weekDatePadding + (maxSlot + 1) * weekEventRowHeight + 32,
  );

  return (
    <div>
      <DayOfWeekHeader />
      <div
        style={{
          position: 'relative',
          minHeight: rowHeight,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {days.map((day) => {
            const key = toDateString(day);
            const dayEvents = scheduleMap[key] ?? [];
            const isToday = key === todayString;
            const dayOfWeek = day.getDay();

            return (
              <div
                key={key}
                onClick={() => dayEvents.length > 0 && onDayClick(day, dayEvents)}
                style={{
                  height: '100%',
                  background: '#111',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                  padding: '8px 10px 0',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = '#1a0a12';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = '#111';
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    fontSize: '1rem',
                    fontWeight: isToday ? 900 : 500,
                    color: isToday
                      ? '#fff'
                      : dayOfWeek === 0
                        ? '#f87171'
                        : dayOfWeek === 6
                          ? '#60a5fa'
                          : '#ddd',
                    background: isToday ? '#e11d48' : 'transparent',
                  }}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: `${weekEventRowHeight}px`,
            gap: '3px 0',
            padding: `${weekDatePadding}px 0 16px`,
            pointerEvents: 'none',
            zIndex: 2,
            boxSizing: 'border-box',
          }}
        >
          {slottedEvents.map(({ startCol, span, slotIndex, event }) => (
            <CalendarEventBar
              key={event.id}
              event={event}
              startCol={startCol}
              span={span}
              slotIndex={slotIndex}
              rowHeight={weekEventRowHeight}
              showTime
              onClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayOfWeekHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {DAY_OF_WEEK.map((label, index) => (
        <div
          key={label}
          style={{
            padding: '12px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: index === 0 ? '#f87171' : index === 6 ? '#60a5fa' : '#888',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

interface CalendarEventBarProps {
  event: CalendarEvent;
  startCol: number;
  span: number;
  slotIndex: number;
  rowHeight: number;
  showTime?: boolean;
  onClick: (event: CalendarEvent) => void;
}

function CalendarEventBar({
  event,
  startCol,
  span,
  slotIndex,
  rowHeight,
  showTime = false,
  onClick,
}: CalendarEventBarProps) {
  const { cardBg, titleColor, border } = getEventStyle(event);
  const isMultiDay = span > 1;
  const time = showTime && event.date.includes('T') ? formatTime(event.date) : '';

  return (
    <div
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick(event);
      }}
      title={event.title}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        gridRow: slotIndex + 1,
        background: cardBg,
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        borderLeft: `${isMultiDay ? '3px' : '1px'} solid ${border}`,
        borderRight: `1px solid ${border}`,
        borderRadius: isMultiDay ? '4px 2px 2px 4px' : 4,
        padding: showTime ? '0 7px' : '0 5px',
        fontSize: showTime ? '0.78rem' : '0.72rem',
        color: titleColor,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
        pointerEvents: 'auto',
        lineHeight: `${rowHeight - 2}px`,
        margin: showTime ? '0 2px' : '0 1px',
        display: showTime ? 'flex' : undefined,
        alignItems: showTime ? 'center' : undefined,
        gap: showTime ? 5 : undefined,
      }}
    >
      {time && (
        <span style={{ opacity: 0.6, fontSize: '0.7rem', flexShrink: 0 }}>{time}</span>
      )}
      {showTime ? (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</span>
      ) : event.title}
    </div>
  );
}
