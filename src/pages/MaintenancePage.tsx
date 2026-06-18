import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div className="maintenance-page">
      <div style={{ fontSize: '4rem' }}>⚙️</div>
      <h1>SYSTEM MAINTENANCE</h1>
      <p>현재 무한성 주식거래소는 점검 중입니다.</p>
      <p style={{ fontSize: '0.8rem', marginTop: 4 }}>빠른 시일 내에 복구하겠습니다.</p>
      <Link to="/" className="premium-view-live-btn" style={{ marginTop: 24, display: 'inline-flex' }}>
        <span>무한성으로 귀환하기 ►</span>
      </Link>
    </div>
  );
}
