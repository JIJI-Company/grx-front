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
    <div
      className="container calendar-preview-section animate-fade-in"
      style={{ marginTop: 20, marginBottom: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>WEEKLY SCHEDULE</h2>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>{weekLabel}</span>
        </div>
        <Link
          to="/calendar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 20px',
            fontFamily: "'Oswald', sans-serif",
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: 1,
            color: '#f9a8d4',
            border: '1px solid rgba(225,29,72,0.5)',
            background: 'rgba(225,29,72,0.08)',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          전체 캘린더 →
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {dayOfWeekLabels.map((label, index) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: index === 0 ? '#f87171' : index === 6 ? '#60a5fa' : '#666',
              padding: '6px 0',
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day) => {
          const key = toDateString(day);
          const dayEvents = eventsByDate[key] ?? [];
          const isToday = key === todayString;

          return (
            <div
              key={key}
              style={{
                background: isToday ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.03)',
                border: isToday
                  ? '1px solid rgba(225,29,72,0.5)'
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '8px 6px',
                minHeight: 80,
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: isToday ? 900 : 400,
                  color: isToday
                    ? '#e11d48'
                    : day.getDay() === 0
                      ? '#f87171'
                      : day.getDay() === 6
                        ? '#60a5fa'
                        : '#ccc',
                  marginBottom: 6,
                }}
              >
                {day.getDate()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: getEventBackground(event),
                      borderRadius: 3,
                      padding: '1px 4px',
                      fontSize: '0.65rem',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.6rem', color: '#888' }}>+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
