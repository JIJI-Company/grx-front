import type { LiveStatus } from '../../api/types';
import LiveCard, { LiveCardSkeleton } from './LiveCard';

interface LiveGridProps {
  streams: LiveStatus[];
  isLoading: boolean;
}

export default function LiveGrid({ streams, isLoading }: LiveGridProps) {
  return (
    <div className="live-grid">
      {isLoading
        ? [1, 2, 3].map((key) => <LiveCardSkeleton key={key} />)
        : streams.map((stream) => <LiveCard key={stream.accountId} stream={stream} />)}
    </div>
  );
}
