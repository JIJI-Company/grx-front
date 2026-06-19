import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div className="maintenance-page">
      <div className="text-6xl" aria-hidden="true">⚙️</div>
      <h1>SYSTEM MAINTENANCE</h1>
      <p>현재 무한성 주식거래소는 점검 중입니다.</p>
      <p className="mt-1 text-xs">빠른 시일 내에 복구하겠습니다.</p>
      <Link to="/" className="premium-view-live-btn mt-6">
        <span>무한성으로 귀환하기 ►</span>
      </Link>
    </div>
  );
}
