import type { CalendarEvent } from '../../api/types';
import {
  DAY_OF_WEEK,
  formatTime,
  getEventStyle,
  getMemberColor,
} from './calendarUtils';

interface EventModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

interface DayModalProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
  onEvent: (event: CalendarEvent) => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const { titleColor } = getEventStyle(event);

  return (
    <div
      className="cal-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        style={{
          background: '#1a0a12',
          border: '1px solid rgba(225,29,72,0.4)',
          borderRadius: 16,
          padding: '28px 32px',
          maxWidth: 480,
          width: '90%',
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <div
          style={{
            color: '#888',
            fontSize: '0.8rem',
            marginBottom: 8,
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: 1,
          }}
        >
          {event.date.slice(0, 10)}
          {event.endDate ? ` ~ ${event.endDate.slice(0, 10)}` : ''}
          {event.date.includes('T') ? ` · ${formatTime(event.date)}` : ''}
        </div>
        <h3
          style={{
            color: titleColor,
            fontFamily: "'Oswald', sans-serif",
            fontSize: '1.4rem',
            marginBottom: 12,
          }}
        >
          {event.title}
        </h3>
        {event.members.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {event.members.map((member) => {
              const color = getMemberColor(member);
              return (
                <span
                  key={member}
                  style={{
                    background: color.bg,
                    color: color.text,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                  }}
                >
                  {member}
                </span>
              );
            })}
          </div>
        )}
        {event.memo && (
          <p style={{ color: '#bbb', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
            {event.memo}
          </p>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#e11d48', fontSize: '0.85rem' }}
          >
            🔗 링크 열기
          </a>
        )}
      </div>
    </div>
  );
}

export function DayModal({
  date,
  events,
  onClose,
  onEvent,
}: DayModalProps) {
  return (
    <div
      className="cal-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        style={{
          background: '#1a0a12',
          border: '1px solid rgba(225,29,72,0.3)',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 440,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '1.3rem',
            color: '#fff',
            marginBottom: 16,
          }}
        >
          {date.getMonth() + 1}월 {date.getDate()}일 ({DAY_OF_WEEK[date.getDay()]})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((event) => {
            const { titleColor, cardBg, border } = getEventStyle(event);

            return (
              <div
                key={event.id}
                onClick={() => onEvent(event)}
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>
                    {formatTime(event.date)}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {event.members.slice(0, 3).map((member) => {
                      const color = getMemberColor(member);
                      return (
                        <span
                          key={member}
                          style={{
                            background: color.bg,
                            color: color.text,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                          }}
                        >
                          {member}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ color: titleColor, fontWeight: 700, fontSize: '0.95rem' }}>
                  {event.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
