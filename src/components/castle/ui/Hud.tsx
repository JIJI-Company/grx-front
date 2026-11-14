// 층 HUD: 박스 없이 텍스트와 얇은 금선만. 왼쪽 위 층 이름 위에서 층을 바로 고른다. 오른쪽 위에 시점 전환·나가기.
// 밝은 장면 위에서도 읽히도록 글자에 그림자.
// 좁은 화면(sm 미만)은 늘 떠 있는 것을 줄인다: 왼쪽 위는 지금 층 이름만(누르면 층 목록), 오른쪽 위는 둥근 아이콘 버튼 두 개.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clearEntry } from '../../../castle/entry';
import { FLOORS, type FloorDef } from '../../../castle/floors';
import type { FloorId } from '../../../castle/protocol';
import type { CameraView } from '../../../castle/view';
import { viewLabel } from '../castlePresentation';

interface HudProps {
  floor: FloorDef;
  /** 다른 층을 골랐을 때 */
  onPickFloor: (to: FloorId) => void;
  population: string;
  connection: string | null;
  notice: string | null;
  view: CameraView;
  onToggleView: () => void;
  /** 1인칭인데 아직 마우스가 잠기지 않았으면 클릭 안내 */
  lookHint: boolean;
}

const Diamond = ({ className = '' }: { className?: string }) => <span aria-hidden className={`inline-block size-1 rotate-45 bg-gold-400/70 ${className}`} />;

const SHADOW = '[text-shadow:0_0_6px_#000,0_0_2px_#000]';
const ROUND = 'focus-ring grid size-10 place-items-center rounded-full border border-gold-400/40 bg-castle-950/70 text-ink-200 backdrop-blur-sm transition active:scale-95';

/** 모바일: 지금 층 이름 + 펼치는 층 목록 */
function MobileFloorPicker({ floor, onPickFloor }: { floor: FloorDef; onPickFloor: (to: FloorId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`층 고르기, 지금 ${floor.title} ${floor.sub}`}
        className="focus-ring flex items-center gap-2 py-1"
      >
        <Diamond />
        <span key={floor.id} className="text-[22px] font-black tracking-[0.06em] [text-shadow:0_0_14px_#000] transition duration-1000 starting:opacity-0">
          {floor.sub}
        </span>
        <svg aria-hidden viewBox="0 0 12 12" className={`size-3 text-gold-400/80 transition ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <>
          {/* 바깥을 누르면 닫힌다 */}
          <button type="button" aria-label="층 목록 닫기" className="fixed inset-0 z-0 cursor-default" onClick={() => setOpen(false)} />
          <ul className="relative z-10 mt-2 w-52 overflow-hidden rounded-sm border border-gold-400/40 bg-castle-950/90 shadow-[0_0_24px_#000] backdrop-blur-sm transition duration-200 starting:-translate-y-1 starting:opacity-0">
            {Object.values(FLOORS).map((f) => {
              const here = f.id === floor.id;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={here}
                    aria-current={here}
                    onClick={() => {
                      setOpen(false);
                      onPickFloor(f.id);
                    }}
                    className="focus-ring flex w-full items-baseline gap-3 border-b border-gold-400/10 px-4 py-3 text-left last:border-b-0 active:bg-gold-400/10 disabled:bg-gold-400/10"
                  >
                    <span className={`w-9 shrink-0 text-xs tracking-[0.15em] ${here ? 'text-gold-400' : 'text-gold-400/60'}`}>{f.tag}</span>
                    <span className={`text-[15px] ${here ? 'font-bold text-gold-400' : 'text-ink-50'}`}>{f.sub}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Hud({ floor, onPickFloor, population, connection, notice, view, onToggleView, lookHint }: HudProps) {
  return (
    <>
      <div className={`pointer-events-none absolute top-5 left-4 transition duration-700 ease-castle starting:-translate-x-2 starting:opacity-0 sm:top-7 sm:left-8 ${SHADOW}`}>
        <div className="sm:hidden">
          <MobileFloorPicker floor={floor} onPickFloor={onPickFloor} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2 text-sm tracking-[0.3em] max-sm:hidden">
          <Diamond />
          {Object.values(FLOORS).map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={f.id === floor.id}
              onClick={() => onPickFloor(f.id)}
              aria-label={`${f.title} ${f.sub} 이동`}
              aria-current={f.id === floor.id}
              className="focus-ring border-b border-transparent pb-0.5 text-ink-300 transition hover:border-gold-400/70 hover:text-gold-400 disabled:border-gold-400/50 disabled:text-gold-400"
            >
              {f.tag}
            </button>
          ))}
        </div>
        <h2 key={floor.id} className="mt-1 text-[22px] font-black tracking-[0.06em] [text-shadow:0_0_14px_#000] transition duration-1000 starting:opacity-0 max-sm:sr-only">
          {floor.sub}
        </h2>
        <div className="mt-2.5 mb-1.5 h-px w-14 bg-linear-to-r from-gold-400/70 to-transparent max-sm:mt-1" />
        <p className="text-[13px] tracking-[0.08em] text-ink-300">{population}</p>
        {connection && <p className="mt-1 text-[13px] text-ruby-500">{connection}</p>}
        {notice && <p className="mt-1 text-[13px] text-ink-400">{notice}</p>}
      </div>
      {/* 모바일: 둥근 아이콘 버튼 (시점 · 나가기) */}
      <div className="absolute top-5 right-4 flex gap-2.5 transition duration-700 ease-castle starting:translate-x-2 starting:opacity-0 sm:hidden">
        <button type="button" onClick={onToggleView} aria-label={`시점 전환, 지금 ${viewLabel(view)}`} className={`${ROUND} relative`}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 8h3l2-2.5h8L18 8h3v11H3z" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.6" />
          </svg>
          <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-gold-400 font-sans text-[10px] font-bold text-castle-950">
            {view === 'first' ? 1 : 3}
          </span>
        </button>
        <Link to="/" onClick={clearEntry} aria-label="성을 나서다" className={ROUND}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4H6v16h8M10 12h10M16 8l4 4-4 4" />
          </svg>
        </Link>
      </div>
      <div className={`absolute top-7 right-8 flex items-center gap-6 transition duration-700 ease-castle starting:translate-x-2 starting:opacity-0 max-sm:hidden ${SHADOW}`}>
        <button
          type="button"
          onClick={onToggleView}
          aria-label={`시점 전환 (V), 지금 ${viewLabel(view)}`}
          className="focus-ring flex items-center gap-2 border-b border-gold-400/30 pb-0.5 text-[13px] tracking-[0.2em] text-ink-300 transition hover:border-gold-400/70 hover:text-gold-400"
        >
          <span className="border border-gold-400/40 px-1 font-sans text-[10px] leading-4 tracking-normal text-gold-400/80 pointer-coarse:hidden">V</span>
          {viewLabel(view)}
        </button>
        <Link to="/" onClick={clearEntry} className="focus-ring border-b border-gold-400/30 pb-0.5 text-[13px] tracking-[0.2em] text-ink-300 transition hover:border-gold-400/70 hover:text-gold-400">
          성을 나서다
        </Link>
      </div>
      {view === 'first' && (
        <>
          {/* 조준점 */}
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-1 -translate-1/2 rounded-full bg-gold-400/60 shadow-[0_0_6px_#000]" />
          {lookHint && (
            <p className="pointer-events-none absolute top-[56%] w-full text-center text-[13px] tracking-[0.15em] text-ink-200 [text-shadow:0_0_6px_#000,0_0_2px_#000] transition duration-500 starting:opacity-0">
              화면을 클릭하면 둘러볼 수 있습니다 · Esc 해제
            </p>
          )}
        </>
      )}
      <p className="pointer-events-none absolute bottom-[22px] left-8 flex items-center gap-2 text-[13px] tracking-[0.05em] text-ink-300 [text-shadow:0_0_6px_#000,0_0_2px_#000] pointer-coarse:hidden">
        <Diamond className="opacity-60" />
        방향키 이동 · Shift 달리기 · Space 등롱
      </p>
    </>
  );
}
