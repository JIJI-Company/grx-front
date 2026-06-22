import { Link } from 'react-router-dom';
import type { NoticeStreamer } from '../../api/types';

interface NoticePreviewProps {
  streamers: NoticeStreamer[];
}

// "2026-06-22 18:28:32" → "06.22"
function shortDate(raw: string): string {
  const [, month, day] = raw.split(' ')[0]?.split('-') ?? [];
  return month && day ? `${month}.${day}` : raw;
}

export default function NoticePreview({ streamers }: NoticePreviewProps) {
  const latest = streamers
    .flatMap((streamer) =>
      streamer.notices.map((notice) => ({
        ...notice,
        streamerName: streamer.name,
        avatar: streamer.avatar,
      })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className="update-box schedule-box">
      <div className="box-header">LATEST NOTICE</div>
      <div className="schedule-list">
        {latest.length === 0 && (
          <div className="text-sm text-ink-600">등록된 공지가 없습니다.</div>
        )}
        {latest.map((notice) => {
          const open = () => window.open(notice.url, '_blank', 'noopener');
          return (
            <div
              key={notice.id}
              className="schedule-compact-item cursor-pointer"
              onClick={open}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => event.key === 'Enter' && open()}
            >
              {notice.avatar && (
                <img src={notice.avatar} alt={notice.streamerName} className="sc-avatar" />
              )}
              <div className="sc-info">
                <div className="sc-name truncate">{notice.title}</div>
                <div className="sc-time">
                  {notice.streamerName} · {shortDate(notice.date)}
                </div>
              </div>
              <span className="sc-live-badge">NEW</span>
            </div>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <Link to="/notice" className="premium-view-live-btn px-6 py-2.5 text-sm">
          <span className="pulse-ring" />
          <span>전체 공지 보러가기</span>
          <span> ►</span>
        </Link>
      </div>
    </div>
  );
}
