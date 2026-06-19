import type { ContentItem } from '../../api/types';
import YoutubeFeed from './YoutubeFeed';

interface NewsSectionProps {
  items: ContentItem[];
}

export default function NewsSection({ items }: NewsSectionProps) {
  return (
    <div className="page-shell news-section animate-fade-in">
      <div className="section-row">
        <div className="news-main">
          <h2 className="section-title">LATEST ANNOUNCEMENT</h2>
          <div className="grid">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.contentId}
                className="card"
                onClick={() => item.externalUrl && window.open(item.externalUrl, '_blank')}
              >
                <div className="card-inner">
                  <div className="card-header">
                    <span className="card-tag">{item.category?.name ?? 'NEWS'}</span>
                    <span className="card-date">
                      {item.publishedAt ? item.publishedAt.split('T')[0] : ''}
                    </span>
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-desc">{item.summary ?? ''}</p>
                  <div className="card-arrow">READ MORE →</div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="col-span-full text-ink-500">뉴스를 불러오는 중입니다.</p>
            )}
          </div>
        </div>
        <div className="news-side">
          <h2 className="section-title">YOUTUBE FEED</h2>
          <YoutubeFeed />
        </div>
      </div>
      <div className="mt-10 flex justify-center">
        <button className="view-all-btn" onClick={() => { window.location.href = '/times'; }}>
          전체 타임즈 보러가기 →
        </button>
      </div>
    </div>
  );
}
