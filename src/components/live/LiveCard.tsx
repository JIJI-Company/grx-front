import type { LiveStatus } from '../../api/types';

interface LiveCardProps {
  stream: LiveStatus;
}

export default function LiveCard({ stream }: LiveCardProps) {
  // Live snapshot when on-air (cache-busted per render), else the profile image.
  const liveThumb =
    stream.isLive && stream.liveThumbnailUrl
      ? `${stream.liveThumbnailUrl}?t=${Date.now()}`
      : null;
  const imageSource = liveThumb ?? stream.profileImageUrl ?? undefined;

  const handleClick = () => {
    const url = stream.streamUrl ?? stream.channelUrl;
    if (url) window.open(url, '_blank');
  };
  const canOpen = !!(stream.streamUrl || stream.channelUrl);

  const liveStyle = stream.isLive && stream.personalColor
    ? ({ '--member-color': stream.personalColor, borderColor: stream.personalColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={`live-card ${stream.isLive ? 'is-live' : ''} ${canOpen ? 'cursor-pointer' : ''}`}
      style={liveStyle}
      onClick={handleClick}
      role={canOpen ? 'link' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onKeyDown={canOpen
        ? (event) => {
            if (event.key === 'Enter') handleClick();
          }
        : undefined}
    >
      <div className="live-card-thumb">
        {imageSource && (
          <img
            src={imageSource}
            alt={stream.memberName ?? 'member'}
            onError={(e) => {
              // Live snapshot can 404 right after a stream ends — fall back to profile.
              const img = e.currentTarget;
              if (stream.profileImageUrl && img.src !== stream.profileImageUrl) {
                img.src = stream.profileImageUrl;
              }
            }}
          />
        )}
        <div className={`live-badge ${stream.isLive ? '' : 'offline-badge'}`}>
          {stream.isLive ? (
            <>
              <span className="live-dot" />
              ON AIR
            </>
          ) : (
            'OFFLINE'
          )}
        </div>
      </div>
      <div className="live-card-body">
        <div className="live-card-name">{stream.memberName}</div>
        <div className="live-card-title">
          {stream.liveTitle ?? (stream.isLive ? '방송 중' : '오프라인')}
        </div>
        {stream.viewerCount != null && (
          <div className="live-card-viewers">
            👁 {stream.viewerCount.toLocaleString()}명
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveCardSkeleton() {
  return (
    <div className="skeleton">
      <div className="sk-thumb" />
      <div className="sk-body">
        <div className="sk-line" />
        <div className="sk-line short" />
      </div>
    </div>
  );
}
