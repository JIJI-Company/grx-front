import type { ContentItem } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';

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
      role={canOpen ? 'link' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onKeyDown={canOpen
        ? (event) => {
            if (event.key === 'Enter') window.open(item.externalUrl!, '_blank');
          }
        : undefined}
    >
      <div className="schedule-members">
        {item.contentMembers.slice(0, memberLimit).map(({ member }) => {
          const color = getMemberColor(member);
          return (
            <div
              key={member.memberId}
              className="schedule-member-chip"
              style={{
                borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
              }}
            >
              {member.profileAsset?.publicUrl && (
                <img src={member.profileAsset.publicUrl} alt={member.stageName} />
              )}
              <span>{member.stageName}</span>
            </div>
          );
        })}
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
        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          {item.summary}
        </p>
      )}
    </div>
  );
}
