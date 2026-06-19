import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMemberColor } from '../../utils/memberColor';
import { useMembers } from '../../hooks/useMembers';

export default function MemberSlider() {
  const { data } = useMembers();
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const likaClicks = useRef(0);
  const likaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleLikaClick = useCallback(() => {
    likaClicks.current++;
    clearTimeout(likaTimer.current);

    if (likaClicks.current >= 5) {
      navigate('/lika');
    } else {
      likaTimer.current = setTimeout(() => {
        likaClicks.current = 0;
      }, 2000);
    }
  }, [navigate]);

  const moveSlider = (delta: number) => {
    if (sliderRef.current) sliderRef.current.scrollLeft += delta;
  };

  const allMembers = [
    ...(data?.master ?? []),
    ...(data?.upper ?? []),
    ...(data?.lower ?? []),
    ...(data?.new ?? []),
  ];

  return (
    <section className="member-section">
      <div className="section-header page-shell">
        <h2 className="section-title">G-CASTLE CREW</h2>
        <p className="section-desc">멤버가 아무리 많아도 가로로 슥슥 넘겨보세요.</p>
        <div className="mt-5 flex justify-center">
          <button className="view-all-btn" onClick={() => navigate('/members')}>
            멤버 전용 페이지 보러가기 →
          </button>
        </div>
      </div>

      <button className="slider-btn btn-prev" onClick={() => moveSlider(-310)}>❮</button>
      <button className="slider-btn btn-next" onClick={() => moveSlider(310)}>❯</button>

      <div className="slider-container" ref={sliderRef}>
        {allMembers.map((member) => {
          const color = getMemberColor(member);
          return (
          <div
            key={member.memberId}
            className="mini-card"
            style={{ '--member-color': color } as React.CSSProperties}
            onClick={member.slug === 'lika' ? handleLikaClick : undefined}
            role={member.slug === 'lika' ? 'button' : undefined}
            tabIndex={member.slug === 'lika' ? 0 : undefined}
            onKeyDown={member.slug === 'lika'
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') handleLikaClick();
                }
              : undefined}
          >
            {member.profileAsset?.publicUrl && (
              <img src={member.profileAsset.publicUrl} alt={member.stageName} />
            )}
            <div className="mini-card-info">
              <p className="mini-name">{member.stageName}</p>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
