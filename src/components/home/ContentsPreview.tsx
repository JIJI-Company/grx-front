import { Link } from 'react-router-dom';
import type { ContentsArchiveItem } from '../../api/types';

interface ContentsPreviewProps {
  items: ContentsArchiveItem[];
  isLoading?: boolean;
}

function formatDate(value: string) {
  if (!value) return '상시 진행';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

export default function ContentsPreview({ items, isLoading = false }: ContentsPreviewProps) {
  const latest = items.slice(0, 4);

  return (
    <section className="page-shell contents-preview-section animate-fade-in my-5">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="section-title mb-1">CONTENTS</h2>
          <span className="text-xs text-ink-500 sm:text-sm">꾸한성 최신 콘텐츠 아카이브</span>
        </div>
        <Link
          to="/contents"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ruby-600/50 bg-ruby-600/8 px-4 py-2 font-display text-xs font-semibold tracking-wider text-pink-300 sm:px-5 sm:text-sm"
        >
          전체 콘텐츠 →
        </Link>
      </div>

      {latest.length > 0 ? (
        <div className="contents-preview-grid">
          {latest.map((item) => (
            <Link key={item.id} to="/contents" className="contents-preview-card">
              <div className="contents-preview-thumb">
                <img src={item.imageUrl || '/img/ggu_title.jpg'} alt={item.title} loading="lazy" />
              </div>
              <div className="contents-preview-copy">
                <span>{formatDate(item.date)}</span>
                <h3>{item.title}</h3>
                {item.tags.length > 0 && (
                  <p>
                    {item.tags.slice(0, 3).map((tag) => (
                      <b key={tag}>#{tag.replace(/^#/, '')}</b>
                    ))}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="contents-preview-empty">
          {isLoading ? '콘텐츠를 불러오는 중입니다.' : '표시할 콘텐츠가 없습니다.'}
        </div>
      )}
    </section>
  );
}
