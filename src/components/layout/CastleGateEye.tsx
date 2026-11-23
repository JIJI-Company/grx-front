// 헤더 무한성 입구: 커서를 따라 눈동자를 굴리고 가끔 깜빡이는 도깨비 눈.
// 누르면 눈이 번쩍 뜨이고, 붉은 기운의 사선 베기가 화면을 가른 뒤 어둠 속으로 /castle에 내려간다.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

/** 눈동자가 눈 가운데서 움직일 수 있는 거리(viewBox 단위) */
const REACH_X = 4.2;
const REACH_Y = 2.2;
/** X자 베기 → 가운데 세로 베기가 벌어져 화면이 갈라짐 → 이동까지 걸리는 시간(ms) */
const SWALLOW_MS = 1300;
/** 베기 순서: X자 두 줄(살짝 벌어짐) 뒤 마지막은 가운데 세로(크게 벌어져 화면을 가른다).
 *  angle은 도(0 = 왼→오, 90 = 위→아래), open은 틈이 벌어지는 배수 */
const SLASHES = [
  { angle: 35, y: '50%', delay: 0, open: 2.5 },
  { angle: 145, y: '50%', delay: 170, open: 2.5 },
  { angle: 90, y: '50%', delay: 420, open: 60 },
];

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** 한 번이라도 눌렀으면 NEW 점을 다시 띄우지 않는다 (내 화면 설정이라 localStorage) */
const SEEN_KEY = 'castle.eyeSeen';
const wasSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* 저장이 막힌 브라우저: 이번 화면에서만 숨긴다 */
  }
};

export default function CastleGateEye() {
  const eye = useRef<HTMLAnchorElement>(null);
  const pupil = useRef<SVGGElement>(null);
  const navigate = useNavigate();
  const [swallow, setSwallow] = useState<{ x: number; y: number } | null>(null);
  const [seen, setSeen] = useState(wasSeen);

  const dismiss = () => {
    markSeen();
    setSeen(true);
  };

  useEffect(() => {
    if (reducedMotion()) return undefined;
    let frame = 0;
    let target = { x: 0, y: 0 };
    const move = (e: PointerEvent) => {
      const box = eye.current?.getBoundingClientRect();
      if (!box) return;
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, len / 240); // 가까울수록 덜, 멀면 끝까지 쳐다본다
      target = { x: (dx / len) * REACH_X * pull, y: (dy / len) * REACH_Y * pull };
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          pupil.current?.setAttribute('transform', `translate(${target.x.toFixed(2)} ${target.y.toFixed(2)})`);
        });
      }
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!swallow) return undefined;
    // 칼이 지나갈 때마다 페이지를 짧게 흔든다(타격감). body를 흔들면 fixed 오버레이 기준이 바뀌어 #root만 흔든다
    const page = document.getElementById('root') ?? document.body;
    const shakes = SLASHES.map(({ delay }) =>
      window.setTimeout(() => {
        page.classList.remove('castle-shake');
        void page.offsetWidth; // 같은 애니메이션을 다시 시작
        page.classList.add('castle-shake');
      }, delay + 90),
    );
    const t = window.setTimeout(() => navigate('/castle'), SWALLOW_MS);
    return () => {
      shakes.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(t);
      page.classList.remove('castle-shake');
    };
  }, [swallow, navigate]);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    dismiss();
    // 새 탭 열기·움직임 줄이기 설정은 그냥 이동
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || reducedMotion()) return;
    e.preventDefault();
    if (swallow) return;
    const box = eye.current?.getBoundingClientRect();
    pupil.current?.setAttribute('transform', 'translate(0 0)');
    setSwallow({ x: box ? box.left + box.width / 2 : 0, y: box ? box.top + box.height / 2 : 0 });
  };

  return (
    <span className="castle-eye-wrap">
      <Link
        ref={eye}
        to="/castle"
        onClick={onClick}
        aria-label="무한성으로 내려가기"
        title="무한성으로 내려가기"
        className={`castle-eye focus-ring${swallow ? ' is-awake' : ''}`}
      >
        <svg viewBox="0 0 32 20" className="castle-eye__svg" aria-hidden="true">
          <defs>
            <radialGradient id="castle-eye-iris" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#ffd0da" />
              <stop offset="45%" stopColor="#ff1a4a" />
              <stop offset="100%" stopColor="#5a0518" />
            </radialGradient>
            <clipPath id="castle-eye-lid">
              <path d="M2 10C7 3 25 3 30 10 25 17 7 17 2 10Z" />
            </clipPath>
          </defs>
          <g className="castle-eye__open">
            <path className="castle-eye__white" d="M2 10C7 3 25 3 30 10 25 17 7 17 2 10Z" />
            <g clipPath="url(#castle-eye-lid)">
              <g ref={pupil} className="castle-eye__pupil">
                <circle cx="16" cy="10" r="5.4" fill="url(#castle-eye-iris)" />
                <ellipse className="castle-eye__slit" cx="16" cy="10" rx="1.3" ry="3.6" fill="#0b0205" />
                <circle cx="17.8" cy="8" r="1.1" fill="#fff" opacity="0.9" />
              </g>
            </g>
          </g>
          <path className="castle-eye__lash" d="M2 10C7 3 25 3 30 10" />
        </svg>
        {!seen && <span className="castle-eye__new" aria-hidden="true" />}
        <span className="castle-eye__label">무한성 입장</span>
      </Link>
      {swallow &&
        createPortal(
          <div className="castle-slash" aria-hidden="true">
            <svg width="0" height="0" className="absolute">
              <defs>
                <filter id="castle-slash-glow" x="-5%" y="-300%" width="110%" height="700%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                {/* 칼이 지나간 방향(왼→오)으로 꼬리가 옅어지는 잔상 */}
                <linearGradient id="castle-slash-trail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff1a3c" stopOpacity="0" />
                  <stop offset="35%" stopColor="#ff1a3c" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ff4d63" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>
            {SLASHES.map((cut, i) => (
              <svg
                key={i}
                viewBox="0 0 1600 300"
                preserveAspectRatio="none"
                className="castle-slash__cut"
                style={{ '--a': `${cut.angle}deg`, '--y': cut.y, '--d': `${cut.delay}ms`, '--open': cut.open } as React.CSSProperties}
              >
                {/* 베인 자리가 벌어지는 검은 틈 (붉은 테) */}
                <path className="castle-slash__gap" d="M0 150Q800 120 1600 150Q800 180 0 150Z" />
                {/* 잔상 + 칼날 빛 */}
                <path d="M0 150Q800 138 1600 150Q800 162 0 150Z" fill="url(#castle-slash-trail)" filter="url(#castle-slash-glow)" transform="translate(0 0) scale(1 1.6)" transform-origin="800 150" />
                <path className="castle-slash__edge" d="M0 150Q800 141 1600 150Q800 159 0 150Z" />
              </svg>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
