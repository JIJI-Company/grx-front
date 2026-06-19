import type { LiveStatus } from '../../api/types';
import LiveCard, { LiveCardSkeleton } from './LiveCard';

interface LiveGridProps {
  streams: LiveStatus[];
  isLoading: boolean;
}

export default function LiveGrid({ streams, isLoading }: LiveGridProps) {
  // On-air first; order within each group preserved (the API already returns
  // members in Members-page order). Array.prototype.sort is stable.
  const ordered = [...streams].sort((a, b) => Number(b.isLive) - Number(a.isLive));

  return (
    <div className="live-grid">
      {isLoading
        ? [1, 2, 3].map((key) => <LiveCardSkeleton key={key} />)
        : ordered.map((stream) => <LiveCard key={stream.accountId} stream={stream} />)}
    </div>
  );
}
