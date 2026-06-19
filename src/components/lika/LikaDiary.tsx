import { useEffect, useState } from 'react';

export default function LikaDiary() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const diary = document.getElementById('lika-diary-reveal');
    if (diary) diary.style.animation = 'slideInRight 0.8s ease forwards';
  }, [isOpen]);

  return (
    <div className="mt-10 pb-15 text-center">
      <p className="mb-3 text-xs text-ink-600">비밀이 있다...</p>
      <button
        className="premium-view-live-btn"
        onClick={() => setIsOpen(true)}
      >
        <span>📖 리카의 다이어리 열기</span>
      </button>
      {isOpen && (
        <div
          id="lika-diary-reveal"
          className="mt-6 rounded-panel bg-[#FFFDE7] p-5 text-center text-[#5D4037] sm:p-7"
        >
          <h3 className="mb-2 text-xl font-black">
            LIKA&apos;S DIARY
          </h3>
          <p>🦖 항아리 안에 비밀이 있습니다 💖</p>
        </div>
      )}
    </div>
  );
}
