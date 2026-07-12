import { useYoutubeLatest } from '../../hooks/useContent';

const youtubeChannelUrl = 'https://www.youtube.com/channel/UChU1YQle9vX1xRipUcBcR5g';

export default function YoutubeFeed() {
  const { data, isError } = useYoutubeLatest();
  const video = data?.items?.[0];

  if (isError || !video) {
    return (
      <div className="youtube-box">
        <div className="yt-placeholder" onClick={() => window.open(youtubeChannelUrl, '_blank')}>
          <p>서버 지연으로 영상을 바로 불러올 수 없습니다.</p>
          <span className="mt-1 block text-xs text-ink-400">
            여기를 클릭하여 유튜브에서 직접 확인하세요!
          </span>
        </div>
      </div>
    );
  }

  const pubDate = video.publishedAt.split('T')[0].replace(/-/g, '.');

  return (
    <div className="youtube-box">
      <div className="yt-thumb-container" onClick={() => window.open(video.link, '_blank')}>
        {video.thumbnail && (
          <img src={video.thumbnail} className="yt-thumb" alt={video.title} loading="lazy" decoding="async" />
        )}
        <div className="yt-play-icon">▶</div>
      </div>
      <div className="yt-info">
        <div className="yt-title">{video.title}</div>
        <div className="yt-meta">{pubDate} · YouTube Update</div>
      </div>
    </div>
  );
}
