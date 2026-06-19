import { Link } from 'react-router-dom';
import type { LiveStatus } from '../../api/types';

interface LiveStatusPanelProps {
  data: LiveStatus[];
}

export default function LiveStatusPanel({ data }: LiveStatusPanelProps) {
  const active = data.filter((stream) => stream.isLive);

  if (!active.length) {
    return (
      <div className="update-box live-box">
        <div className="box-header">LIVE STREAMING</div>
        <div className="status-content">
          <div className="status-indicator offline" />
          <span className="status-text">OFFLINE</span>
        </div>
        <div className="py-5 text-center text-sm leading-relaxed text-ink-400">
          💤 현재 무한성 관측 범위 내에 방송 신호가 없습니다.
        </div>
        <div className="mt-5 text-center">
          <Link to="/live" className="premium-view-live-btn">
            <span className="pulse-ring" />
            <span className="btn-text">G-CASTLE 무한 라이브 극장 입장하기</span>
            <span className="btn-arrow"> ►</span>
          </Link>
        </div>
      </div>
    );
  }

  const stream = active[0];

  return (
    <div className="update-box live-box">
      <div className="box-header">LIVE STREAMING</div>
      <div className="status-content">
        <div className="status-indicator online" />
        <span className="status-text text-ruby-500">ON AIR / SYSTEM_ACTIVE</span>
      </div>
      <div className="my-3 flex min-w-0 items-center gap-3">
        {stream.profileImageUrl && (
          <img
            src={stream.profileImageUrl}
            alt={stream.memberName ?? ''}
            className="size-12 shrink-0 rounded-full border border-ruby-500 object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-black sm:text-base">{stream.memberName}</div>
          <div className="mt-0.5 truncate text-xs text-ink-400">
            {stream.liveTitle ?? '방송 중'}
          </div>
        </div>
      </div>
      {active.length > 1 && (
        <div className="mb-2 text-xs text-ink-300">
          + {active.length - 1}명 더 방송 중
        </div>
      )}
      <div className="mt-4 text-center">
        <Link to="/live" className="premium-view-live-btn">
          <span className="pulse-ring" />
          <span>G-CASTLE 무한 라이브 극장 입장하기</span>
          <span> ►</span>
        </Link>
      </div>
    </div>
  );
}
