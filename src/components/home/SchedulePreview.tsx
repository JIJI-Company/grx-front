import { Link } from 'react-router-dom';
import type { ContentItem } from '../../api/types';

interface SchedulePreviewProps {
  items: ContentItem[];
}

export default function SchedulePreview({ items }: SchedulePreviewProps) {
  const topItems = items.slice(0, 3);

  return (
    <div className="update-box schedule-box">
      <div className="box-header">CASTLE SCHEDULE</div>
      <div className="schedule-list">
        {topItems.length === 0 && (
          <div className="text-sm text-ink-600">진행 예정인 일정이 없습니다.</div>
        )}
        {topItems.map((item) => {
          const member = item.contentMembers?.[0]?.member;
          const name = member?.stageName ?? item.title;
          const avatar = member?.profileAsset?.publicUrl ?? undefined;
          const time = item.eventStartAt
            ? new Date(item.eventStartAt).toLocaleString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div key={item.contentId} className="schedule-compact-item">
              {avatar && <img src={avatar} alt={name} className="sc-avatar" />}
              <div className="sc-info">
                <div className="sc-name">{name}</div>
                <div className="sc-time">{time}</div>
              </div>
              {item.contentMembers?.[0] && <span className="sc-live-badge">SCHED</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <Link
          to="/schedule"
          className="premium-view-live-btn px-6 py-2.5 text-sm"
        >
          <span className="pulse-ring" />
          <span>전체 스케줄 보러가기</span>
          <span> ►</span>
        </Link>
      </div>
    </div>
  );
}
