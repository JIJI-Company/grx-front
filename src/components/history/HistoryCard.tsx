import type { ContentItem } from '../../api/types';

interface HistoryCardProps {
  item: ContentItem;
}

export default function HistoryCard({ item }: HistoryCardProps) {
  const thumbnail = item.thumbnailAsset?.publicUrl
    ?? item.contentAssets?.[0]?.asset?.publicUrl
    ?? undefined;
  const date = item.publishedAt ? item.publishedAt.split('T')[0] : '';
  const members = item.contentMembers.map(({ member }) => member.stageName).join(', ');
  const canOpen = !!item.externalUrl;

  return (
    <div
      className="history-card"
      onClick={() => canOpen && window.open(item.externalUrl!, '_blank')}
      style={{ cursor: canOpen ? 'pointer' : 'default' }}
    >
      {thumbnail && <img src={thumbnail} alt={item.title} className="history-card-thumb" />}
      <div className="history-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="card-tag">{item.category?.name ?? item.contentType}</span>
          <span style={{ fontSize: '0.72rem', color: '#555' }}>{date}</span>
        </div>
        <div className="history-card-title">{item.title}</div>
        {members && (
          <p style={{ fontSize: '0.78rem', color: 'var(--bright-rose)', marginTop: 4 }}>
            {members}
          </p>
        )}
        {item.summary && <p className="history-card-desc">{item.summary}</p>}
      </div>
    </div>
  );
}
