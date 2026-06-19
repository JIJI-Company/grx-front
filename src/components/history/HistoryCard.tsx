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
      role={canOpen ? 'link' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onKeyDown={canOpen
        ? (event) => {
            if (event.key === 'Enter') window.open(item.externalUrl!, '_blank');
          }
        : undefined}
    >
      {thumbnail && <img src={thumbnail} alt={item.title} className="history-card-thumb" />}
      <div className="history-card-body">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="card-tag">{item.category?.name ?? item.contentType}</span>
          <span className="text-[0.72rem] text-ink-600">{date}</span>
        </div>
        <div className="history-card-title">{item.title}</div>
        {members && (
          <p className="mt-1 text-xs text-ruby-600">
            {members}
          </p>
        )}
        {item.summary && <p className="history-card-desc">{item.summary}</p>}
      </div>
    </div>
  );
}
