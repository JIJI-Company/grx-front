import type { CalendarEvent } from '../../api/types';
import {
  DAY_OF_WEEK,
  formatTime,
  getEventStyle,
  getMemberAvatar,
  getMemberColor,
} from './calendarUtils';
import { useMemberLookup } from '../../hooks/useMembers';

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
  const lookup = useMemberLookup();

  return (
    <div
      className="modal-overlay active"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="detail-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
      >
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="일정 상세 닫기"
        >
          ×
        </button>
        <span className="detail-modal-sub">OPERATION DETAIL</span>
        <h3 className="detail-modal-main-title">SCHEDULE</h3>
        {event.members.length > 0 && (
          <div className="detail-modal-profile-area">
            <div className="detail-modal-avatar-group">
              {event.members.slice(0, 4).map((member) => (
                <img
                  key={member}
                  src={lookup.getAvatar(member, getMemberAvatar(member))}
                  alt={member}
                  onError={(error) => {
                    error.currentTarget.src = '/img/ggu_title.jpg';
                  }}
                />
              ))}
              {event.members.length > 4 && (
                <div className="detail-modal-extra-avatar">+{event.members.length - 4}</div>
              )}
            </div>
            <div className="detail-modal-badge-group">
              {event.members.map((member) => {
                const color = lookup.getColor(member, getMemberColor(member));
                return (
                  <span
                    key={member}
                    style={{
                      background: color.bg,
                      color: color.text,
                    }}
                    className="detail-modal-member-badge"
                  >
                    {member}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <h3
          id="calendar-event-title"
          className="detail-modal-event-title"
          style={{
            color: titleColor,
          }}
        >
          {event.title}
        </h3>
        <div className="detail-modal-time-row">
          {event.date.slice(0, 10)}
          {event.endDate ? ` ~ ${event.endDate.slice(0, 10)}` : ''}
          {event.date.includes('T') ? ` · ${formatTime(event.date)}` : ''}
        </div>
        <hr className="detail-modal-divider" />
        {event.memo && (
          <p className="detail-modal-memo">
            {event.memo}
          </p>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="event-link-btn"
          >
            자세히 보기
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
  const lookup = useMemberLookup();
  return (
    <div
      className="modal-overlay active"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="day-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-title"
      >
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="일자 일정 닫기"
        >
          ×
        </button>
        <div className="day-modal-header">
          <div className="day-modal-badge">
            <span className="day-modal-badge-num">{date.getDate()}</span>
            <span className="day-modal-badge-day">{DAY_OF_WEEK[date.getDay()]}</span>
          </div>
          <div className="day-modal-title-area">
            <span className="day-modal-sub">DAY SCHEDULE</span>
            <h3 id="calendar-day-title" className="day-modal-title">
              {date.getMonth() + 1}월 {date.getDate()}일
            </h3>
            <span className="day-modal-count">일정 {events.length}개</span>
          </div>
        </div>
        <div className="day-modal-body">
          {events.map((event) => {
            const { titleColor, cardBg, border } = getEventStyle(event);
            const primaryMember = event.members[0] ?? 'All';

            return (
              <div
                key={event.id}
                onClick={() => onEvent(event)}
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                }}
                className="day-schedule-item"
                role="button"
                tabIndex={0}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter') onEvent(event);
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
                  </div>
                  <div className="day-schedule-title" style={{ color: titleColor }}>
                    {event.title}
                  </div>
                  {event.memo && <div className="day-schedule-memo">{event.memo}</div>}
                </div>
                <div className="day-schedule-arrow">▶</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
