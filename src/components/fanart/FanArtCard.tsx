import type { FanArt } from './fanartMockData';

interface FanArtCardProps {
  art: FanArt;
  onOpen: (art: FanArt) => void;
}

export default function FanArtCard({ art, onOpen }: FanArtCardProps) {
  const aspectRatio = art.width / art.height;
  const isGradient = art.thumbUrl.startsWith('linear-gradient');
  const date = new Date(art.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      type="button"
      className="fanart-card"
      onClick={() => onOpen(art)}
    >
      <div className="fanart-card-img" style={{ aspectRatio }}>
        {isGradient ? (
          <div className="fanart-card-placeholder" style={{ background: art.thumbUrl }} />
        ) : (
          <img src={art.thumbUrl} alt={art.title} loading="lazy" decoding="async" />
        )}
      </div>
      <div className="fanart-card-info">
        <span className="fanart-card-title">{art.title}</span>
        <span className="fanart-card-meta">
          {art.memberNames.join(', ')} · {art.authorName} · {date}
        </span>
      </div>
    </button>
  );
}
