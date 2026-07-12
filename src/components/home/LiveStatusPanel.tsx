import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { LiveStatus } from '../../api/types';

interface LiveStatusPanelProps {
  data: LiveStatus[];
}

export default function LiveStatusPanel({ data }: LiveStatusPanelProps) {
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const didDrag = useRef(false);
  const active = data.filter((stream) => stream.isLive);
  const isOnline = active.length > 0;

  const finishDrag = () => {
    dragState.current.isDown = false;
    window.setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };

  return (
    <div className="update-box live-box">
      <div className="box-header">LIVE STREAMING</div>
      <div className="status-content">
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
        <span className={`status-text ${isOnline ? 'text-ruby-500' : ''}`}>
          {isOnline ? 'ON AIR / SYSTEM_ACTIVE' : 'OFFLINE'}
        </span>
      </div>

      {!isOnline ? (
        <div className="py-5 text-center text-sm leading-relaxed text-ink-400">
          💤 현재 무한성 관측 범위 내에 방송 신호가 없습니다.
        </div>
      ) : (
        <>
          <div className="premium-live-multi">
            <div className="multi-header">
              현재 <span className="highlight">{active.length}명</span>의 멤버가 라이브 중입니다 📡
            </div>
            <div
              className="multi-avatar-grid"
              onPointerDown={(event) => {
                dragState.current = {
                  isDown: true,
                  startX: event.clientX,
                  scrollLeft: event.currentTarget.scrollLeft,
                };
                didDrag.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!dragState.current.isDown) return;
                const walk = event.clientX - dragState.current.startX;
                if (Math.abs(walk) > 5) didDrag.current = true;
                event.currentTarget.scrollLeft = dragState.current.scrollLeft - walk;
              }}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onPointerLeave={() => {
                dragState.current.isDown = false;
              }}
            >
            {active.map((stream) => {
              const url = stream.streamUrl ?? stream.channelUrl ?? undefined;
              const open = () => {
                if (didDrag.current) return;
                if (url) window.open(url, '_blank', 'noopener');
              };
              return (
                <div
                  key={stream.accountId}
                  className="premium-multi-item"
                  onClick={open}
                  role={url ? 'link' : undefined}
                  tabIndex={url ? 0 : undefined}
                  onKeyDown={url ? (event) => event.key === 'Enter' && open() : undefined}
                  title={stream.liveTitle ?? stream.memberName ?? ''}
                >
                  <div className="multi-avatar-shell">
                    {stream.profileImageUrl ? (
                      <img src={stream.profileImageUrl} alt={stream.memberName ?? ''} loading="lazy" decoding="async" />
                    ) : (
                      <div className="multi-avatar-fallback">
                        {(stream.memberName ?? 'C').charAt(0)}
                      </div>
                    )}
                    <span className="multi-live-dot" />
                  </div>
                  <span className="premium-multi-name">{stream.memberName ?? 'CREW'}</span>
                  <span className="premium-multi-plat">{stream.platform}</span>
                </div>
              );
            })}
            </div>
          </div>
        </>
      )}

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
