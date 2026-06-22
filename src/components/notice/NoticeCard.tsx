import type { NoticeItem } from '../../api/types';

interface NoticeCardProps {
  notice: NoticeItem;
  accent: string;
}

// "2026-06-22 18:28:32" → "2026.06.22"
function formatDate(raw: string): string {
  const datePart = raw.split(' ')[0];
  return datePart ? datePart.replace(/-/g, '.') : raw;
}

export default function NoticeCard({ notice, accent }: NoticeCardProps) {
  const open = () => window.open(notice.url, '_blank', 'noopener');
  const hasThumb = !!notice.thumbnail;

  return (
    <div
      className={`notice-card ${hasThumb ? '' : 'no-thumbnail'}`}
      onClick={open}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
    >
      {hasThumb && (
        <div className="notice-thumb">
          <img src={notice.thumbnail!} alt={notice.title} loading="lazy" />
        </div>
      )}
      <div className="notice-content">
        <h3 className="notice-title">{notice.title}</h3>
      </div>
      <div className="notice-footer">
        <span className="notice-flag" style={{ color: accent }}>
          새 소식 📡
        </span>
        <span className="notice-meta">
          {formatDate(notice.date)} · 👁 {notice.readCount} · 💬 {notice.commentCount}
        </span>
      </div>
    </div>
  );
}
