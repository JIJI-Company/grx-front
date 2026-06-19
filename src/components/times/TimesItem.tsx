import type { ContentItem } from '../../api/types';

interface TimesItemProps {
  item: ContentItem;
}

export default function TimesItem({ item }: TimesItemProps) {
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const canOpen = !!item.externalUrl;

  return (
    <div
      className="times-item"
      onClick={() => canOpen && window.open(item.externalUrl!, '_blank')}
      role={canOpen ? 'link' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onKeyDown={canOpen
        ? (event) => {
            if (event.key === 'Enter') window.open(item.externalUrl!, '_blank');
          }
        : undefined}
    >
      <div className="times-item-header">
        <span className="times-tag">{item.category?.name ?? item.contentType}</span>
        <span className="times-date">{date}</span>
      </div>
      <div className="times-title">{item.title}</div>
      {item.summary && <div className="times-desc">{item.summary}</div>}
    </div>
  );
}
