import { Link } from 'react-router-dom';
import type { CalendarEvent } from '../../api/types';

const dayOfWeekLabels = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function getEventBackground(event: CalendarEvent) {
  if (event.title.includes('휴방') || event.tags.includes('휴방')) return '#f59e0b';
  if (event.tags.some((tag) => tag.includes('콘텐츠') || tag.includes('컨텐츠'))) return '#06b6d4';
  return '#e11d48';
}

interface WeeklyCalendarProps {
  events: CalendarEvent[];
}

export default function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const today = new Date();
  const startDay = today.getDay();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - startDay + index);
    return date;
  });
  const todayString = toDateString(today);
  const eventsByDate: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    if (!event.date) continue;
    const start = event.date.slice(0, 10);
    const end = event.endDate ? event.endDate.slice(0, 10) : start;

    for (const day of days) {
      const key = toDateString(day);
      if (key >= start && key <= end) {
        (eventsByDate[key] ??= []).push(event);
      }
    }
  }

  const weekLabel = `${toDateString(days[0])} ~ ${toDateString(days[6])}`;

  return (
    <div className="page-shell calendar-preview-section animate-fade-in my-5 overflow-hidden">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="section-title mb-1">WEEKLY SCHEDULE</h2>
          <span className="text-xs text-ink-500 sm:text-sm">{weekLabel}</span>
        </div>
        <Link
          to="/calendar"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ruby-600/50 bg-ruby-600/8 px-4 py-2 font-display text-xs font-semibold tracking-wider text-pink-300 sm:px-5 sm:text-sm"
        >
          전체 캘린더 →
        </Link>
      </div>
      <div className="grid min-w-[36rem] grid-cols-7 gap-1 pb-1">
        {dayOfWeekLabels.map((label, index) => (
          <div
            key={label}
            className={`py-1.5 text-center text-xs font-bold ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-ink-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="no-scrollbar overflow-x-auto pb-2">
        <div className="grid min-w-[36rem] grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toDateString(day);
          const dayEvents = eventsByDate[key] ?? [];
          const isToday = key === todayString;

          return (
            <div
              key={key}
              className={`min-h-20 rounded-panel border px-1.5 py-2 ${
                isToday
                  ? 'border-ruby-600/50 bg-ruby-600/10'
                  : 'border-white/7 bg-white/3'
              }`}
            >
              <div
                className={`mb-1.5 text-center text-sm ${
                  isToday
                    ? 'font-black text-ruby-600'
                    : day.getDay() === 0
                      ? 'text-red-400'
                      : day.getDay() === 6
                        ? 'text-blue-400'
                        : 'text-ink-200'
                }`}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: getEventBackground(event),
                    }}
                    className="truncate rounded-[3px] px-1 py-px text-[0.65rem] text-white"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[0.6rem] text-ink-400">+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
