import type { ContentItem } from '../../api/types';

interface ScheduleCardProps {
  item: ContentItem;
  memberLimit?: number;
  dateOptions?: Intl.DateTimeFormatOptions;
  showCrewFallback?: boolean;
  showEndTime?: boolean;
  showSummary?: boolean;
  openExternalUrl?: boolean;
}

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export default function ScheduleCard({
  item,
  memberLimit = 3,
  dateOptions = defaultDateOptions,
  showCrewFallback = false,
  showEndTime = false,
  showSummary = false,
  openExternalUrl = false,
}: ScheduleCardProps) {
  const time = item.eventStartAt
    ? new Date(item.eventStartAt).toLocaleString('ko-KR', dateOptions)
    : '';
  const endTime = showEndTime && item.eventEndAt
    ? new Date(item.eventEndAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const canOpen = openExternalUrl && !!item.externalUrl;

  return (
    <div
      className="schedule-card"
      onClick={() => canOpen && window.open(item.externalUrl!, '_blank')}
      style={{ cursor: canOpen ? 'pointer' : 'default' }}
    >
      <div className="schedule-members">
        {item.contentMembers.slice(0, memberLimit).map(({ member }) => (
          <div key={member.memberId} className="schedule-member-chip">
            {member.profileAsset?.publicUrl && (
              <img src={member.profileAsset.publicUrl} alt={member.stageName} />
            )}
            <span>{member.stageName}</span>
          </div>
        ))}
        {showCrewFallback && item.contentMembers.length === 0 && (
          <div className="schedule-member-chip">
            <span>CREW</span>
          </div>
        )}
      </div>
      <div className="schedule-title">{item.title}</div>
      {time && (
        <div className="schedule-time">
          📅 {time}{endTime ? ` ~ ${endTime}` : ''}
        </div>
      )}
      {showSummary && item.summary && (
        <p style={{ fontSize: '0.8rem', color: '#777', marginTop: 8, lineHeight: 1.5 }}>
          {item.summary}
        </p>
      )}
    </div>
  );
}
