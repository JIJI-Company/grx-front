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
      role="presentation"
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="relative w-full max-w-120 rounded-2xl border border-ruby-600/40 bg-[#1a0a12] p-5 sm:px-8 sm:py-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
      >
        <button
          onClick={onClose}
          className="focus-ring absolute top-3 right-3 flex size-9 items-center justify-center rounded-md text-lg text-ink-400 transition hover:bg-white/5 hover:text-white"
          aria-label="일정 상세 닫기"
        >
          ✕
        </button>
        <div className="mb-2 pr-10 font-display text-xs tracking-wider text-ink-400">
          {event.date.slice(0, 10)}
          {event.endDate ? ` ~ ${event.endDate.slice(0, 10)}` : ''}
          {event.date.includes('T') ? ` · ${formatTime(event.date)}` : ''}
        </div>
        <h3
          id="calendar-event-title"
          className="mb-3 font-display text-xl sm:text-2xl"
          style={{
            color: titleColor,
          }}
        >
          {event.title}
        </h3>
        {event.members.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {event.members.map((member) => {
              const color = getMemberColor(member);
              return (
                <span
                  key={member}
                  style={{
                    background: color.bg,
                    color: color.text,
                  }}
                  className="rounded-full px-2.5 py-1 text-xs"
                >
                  {member}
                </span>
              );
            })}
          </div>
        )}
        {event.memo && (
          <p className="mb-3 text-sm leading-relaxed text-[#bbb]">
            {event.memo}
          </p>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex rounded-sm text-sm text-ruby-600 hover:text-ruby-500"
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
      role="presentation"
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="relative max-h-[82dvh] w-full max-w-110 overflow-y-auto rounded-2xl border border-ruby-600/30 bg-[#1a0a12] p-5 sm:px-7 sm:py-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-title"
      >
        <button
          onClick={onClose}
          className="focus-ring absolute top-3 right-3 flex size-9 items-center justify-center rounded-md text-lg text-ink-400 transition hover:bg-white/5 hover:text-white"
          aria-label="일자 일정 닫기"
        >
          ✕
        </button>
        <div id="calendar-day-title" className="mb-4 pr-10 font-display text-xl text-white">
          {date.getMonth() + 1}월 {date.getDate()}일 ({DAY_OF_WEEK[date.getDay()]})
        </div>
        <div className="flex flex-col gap-2.5">
          {events.map((event) => {
            const { titleColor, cardBg, border } = getEventStyle(event);

            return (
              <div
                key={event.id}
                onClick={() => onEvent(event)}
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                }}
                className="focus-ring cursor-pointer rounded-xl px-3.5 py-2.5"
                role="button"
                tabIndex={0}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter') onEvent(event);
                }}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-ink-400">
                    {formatTime(event.date)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {event.members.slice(0, 3).map((member) => {
                      const color = getMemberColor(member);
                      return (
                        <span
                          key={member}
                          style={{
                            background: color.bg,
                            color: color.text,
                          }}
                          className="rounded-full px-2 py-0.5 text-xs"
                        >
                          {member}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: titleColor }}>
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
