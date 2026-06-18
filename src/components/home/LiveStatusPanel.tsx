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
        <div style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', padding: '20px 0' }}>
          💤 현재 무한성 관측 범위 내에 방송 신호가 없습니다.
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
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
        <span className="status-text" style={{ color: '#ff1a4a' }}>ON AIR / SYSTEM_ACTIVE</span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0' }}>
        {stream.profileImageUrl && (
          <img
            src={stream.profileImageUrl}
            alt={stream.memberName ?? ''}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #ff1a4a',
            }}
          />
        )}
        <div>
          <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{stream.memberName}</div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>
            {stream.liveTitle ?? '방송 중'}
          </div>
        </div>
      </div>
      {active.length > 1 && (
        <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 8 }}>
          + {active.length - 1}명 더 방송 중
        </div>
      )}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to="/live" className="premium-view-live-btn">
          <span className="pulse-ring" />
          <span>G-CASTLE 무한 라이브 극장 입장하기</span>
          <span> ►</span>
        </Link>
      </div>
    </div>
  );
}
