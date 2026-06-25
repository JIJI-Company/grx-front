import type { CalendarEvent } from '../../api/types';
import {
  DAY_OF_WEEK,
  type ScheduleMap,
  formatTime,
  getEventStyle,
  getGreedySlots,
  getMemberAvatar,
  getMemberColor,
  getWeekDays,
  toDateString,
} from './calendarUtils';
import { useMemberLookup } from '../../hooks/useMembers';

interface CalendarViewProps {
  current: Date;
  scheduleMap: ScheduleMap;
  onDayClick: (date: Date, events: CalendarEvent[]) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const monthEventRowHeight = 54;
const monthDatePadding = 34;
const monthCellMinimumHeight = 80;
const maxVisibleMonthSlots = 3;

export function MonthView({
  current,
  scheduleMap,
  onDayClick,
  onEventClick,
}: CalendarViewProps) {
  const lookup = useMemberLookup();
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
    <div className="cal-grid">
      <DayOfWeekHeader />
      <div className="cal-weeks-container">
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
            className="cal-week-row"
            style={{
              minHeight: rowHeight,
            }}
          >
            <div className="cal-week-grid-bg">
              {week.map((cell) => {
                const key = toDateString(cell.date);
                const dayEvents = scheduleMap[key] ?? [];
                const isToday = key === todayString;
                const dayOfWeek = cell.date.getDay();
                const className = [
                  'cal-cell',
                  cell.isEmpty ? 'empty' : '',
                  isToday ? 'today' : '',
                  dayOfWeek === 0 ? 'sunday' : '',
                  dayOfWeek === 6 ? 'saturday' : '',
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={key}
                    className={className}
                    onClick={() => {
                      if (dayEvents.length > 0 && !cell.isEmpty) {
                        onDayClick(cell.date, dayEvents);
                      }
                    }}
                  >
                    <div className="cal-cell-header">
                      <span className="cal-date-num">{cell.date.getDate()}</span>
                      {dayEvents.length > 0 && !cell.isEmpty && (
                        <span className="cal-count-badge">{dayEvents.length} &gt;</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="cal-week-events-overlay"
              style={{
                gridAutoRows: `${monthEventRowHeight}px`,
                padding: `${monthDatePadding}px 0 14px`,
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
                    onClick={onEventClick}
                    lookup={lookup}
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
                      lineHeight: `${monthEventRowHeight - 2}px`,
                    }}
                    className="cal-more-count"
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
    </div>
  );
}

export function WeekView({
  current,
  scheduleMap,
  onEventClick,
}: CalendarViewProps) {
  const days = getWeekDays(current);
  const todayString = toDateString(new Date());
  const lookup = useMemberLookup();

  return (
    <div className="cal-weekly-list">
      {days.map((day) => {
        const key = toDateString(day);
        const dayEvents = scheduleMap[key] ?? [];
        const isToday = key === todayString;

        return (
          <div key={key} className={`cal-weekly-day ${isToday ? 'today' : ''}`}>
            <div className="cal-weekly-header">
              {day.getMonth() + 1}월{' '}
              <span className={isToday ? 'cal-weekly-date-num today' : 'cal-weekly-date-num'}>
                {day.getDate()}
              </span>
              일
              <span>({DAY_OF_WEEK[day.getDay()]})</span>
            </div>
            <div className="cal-weekly-events">
              {dayEvents.length === 0 ? (
                <div className="cal-weekly-empty">예정된 일정이 없습니다.</div>
              ) : dayEvents.map((event) => (
                <WeeklyEventCard
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  lookup={lookup}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyEventCard({
  event,
  onClick,
  lookup,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  lookup: ReturnType<typeof useMemberLookup>;
}) {
  const { titleColor } = getEventStyle(event);
  const isDayOff = event.title.includes('휴방') || event.tags.includes('휴방');
  const primaryMember = event.members[0] ?? 'All';

  return (
    <button
      type="button"
      className="cal-weekly-event-card"
      onClick={() => onClick(event)}
      style={{
        background: isDayOff ? 'rgba(250, 204, 21, 0.15)' : undefined,
      }}
    >
      <img
        className="day-schedule-avatar"
        src={lookup.getAvatar(primaryMember, getMemberAvatar(primaryMember))}
        alt={primaryMember}
        onError={(error) => {
          error.currentTarget.src = '/img/ggu_title.jpg';
        }}
      />
      <div className="day-schedule-content">
        <div className="day-schedule-title-row">
          <span className="day-schedule-time">{formatTime(event.date)}</span>
          {event.members.map((member) => {
            const color = lookup.getColor(member, getMemberColor(member));
            return (
              <span
                key={member}
                className="cal-member-badge"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {member}
              </span>
            );
          })}
        </div>
        <div
          className="day-schedule-title"
          style={{
            color: isDayOff ? '#facc15' : titleColor,
            textDecoration: isDayOff ? 'line-through' : undefined,
            textDecorationColor: isDayOff ? 'rgba(250,204,21,0.5)' : undefined,
            marginTop: 4,
          }}
        >
          {event.title}
        </div>
        {event.memo && <div className="day-schedule-memo">{event.memo}</div>}
      </div>
    </button>
  );
}

function DayOfWeekHeader() {
  return (
    <div className="cal-grid-header">
      {DAY_OF_WEEK.map((label, index) => (
        <div key={label} className={index === 0 ? 'sunday' : index === 6 ? 'saturday' : ''}>
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
  onClick: (event: CalendarEvent) => void;
  lookup: ReturnType<typeof useMemberLookup>;
}

function CalendarEventBar({
  event,
  startCol,
  span,
  slotIndex,
  onClick,
  lookup,
}: CalendarEventBarProps) {
  const { cardBg, titleColor, border } = getEventStyle(event);
  const isDayOff = event.title.includes('휴방') || event.tags.includes('휴방');
  const shownMembers = event.members.slice(0, span > 1 ? 6 : 3);
  const hiddenMemberCount = event.members.length - shownMembers.length;

  return (
    <div
      className="cal-event-card"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick(event);
      }}
      title={event.title}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        gridRow: slotIndex + 1,
        background: cardBg,
        borderLeft: `3px solid ${border}`,
        color: titleColor,
      }}
    >
      <span
        className="cal-event-title-row"
        style={{
          textDecoration: isDayOff ? 'line-through' : undefined,
          textDecorationColor: isDayOff ? 'rgba(250,204,21,0.5)' : undefined,
        }}
      >
        {event.title}
      </span>
      {shownMembers.length > 0 && (
        <div className="cal-event-member-badges">
          {shownMembers.map((member) => {
            const color = lookup.getColor(member, getMemberColor(member));
            return (
              <span
                key={member}
                className="cal-member-badge"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {member}
              </span>
            );
          })}
          {hiddenMemberCount > 0 && (
            <span className="cal-member-badge cal-member-badge-more">
              +{hiddenMemberCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
