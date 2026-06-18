import { useEffect, useState } from 'react';

export default function LikaDiary() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const diary = document.getElementById('lika-diary-reveal');
    if (diary) diary.style.animation = 'slideInRight 0.8s ease forwards';
  }, [isOpen]);

  return (
    <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 60 }}>
      <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: 12 }}>비밀이 있다...</p>
      <button
        className="premium-view-live-btn"
        onClick={() => setIsOpen(true)}
        style={{ padding: '12px 28px' }}
      >
        <span>📖 리카의 다이어리 열기</span>
      </button>
      {isOpen && (
        <div
          id="lika-diary-reveal"
          style={{
            marginTop: 24,
            padding: 28,
            background: '#FFFDE7',
            borderRadius: 8,
            color: '#5D4037',
            textAlign: 'center',
            animation: 'none',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8 }}>
            LIKA&apos;S DIARY
          </h3>
          <p>🦖 항아리 안에 비밀이 있습니다 💖</p>
        </div>
      )}
    </div>
  );
}
