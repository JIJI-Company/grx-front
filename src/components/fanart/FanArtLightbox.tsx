import { useEffect } from 'react';

interface FanArtPreview {
  title: string;
  authorName: string;
  imageUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

interface FanArtLightboxProps {
  art: FanArtPreview;
  onClose: () => void;
}

export default function FanArtLightbox({ art, onClose }: FanArtLightboxProps) {
  const isGradient = art.imageUrl.startsWith('linear-gradient');
  const date = new Date(art.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fanart-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${art.title} 원본 이미지`}
      onClick={onClose}
    >
      <div className="fanart-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="fanart-lightbox-close"
          aria-label="원본 이미지 닫기"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="fanart-lightbox-img" style={{ aspectRatio: art.width / art.height }}>
          {isGradient ? (
            <div className="fanart-card-placeholder" style={{ background: art.imageUrl }} />
          ) : (
            <img src={art.imageUrl} alt={art.title} />
          )}
        </div>
        <div className="fanart-lightbox-info">
          <h3>{art.title}</h3>
          <p>{art.authorName} · {date}</p>
        </div>
      </div>
    </div>
  );
}
