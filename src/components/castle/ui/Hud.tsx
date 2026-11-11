// 층 HUD: 박스 없이 텍스트와 얇은 금선만. 왼쪽 위 층 이름 위에서 층을 바로 고른다. 오른쪽 위에 시점 전환·나가기.
import { Link } from 'react-router-dom';
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

export default function Hud({ floor, onPickFloor, population, connection, notice, view, onToggleView, lookHint }: HudProps) {
  return (
    <>
      <div className="pointer-events-none absolute top-7 left-8 transition duration-700 ease-castle starting:-translate-x-2 starting:opacity-0">
        <div className="pointer-events-auto flex items-center gap-2 text-xs tracking-[0.3em]">
          <Diamond />
          {Object.values(FLOORS).map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={f.id === floor.id}
              onClick={() => onPickFloor(f.id)}
              aria-label={`${f.title} ${f.sub} 이동`}
              aria-current={f.id === floor.id}
              className="focus-ring border-b border-transparent pb-0.5 text-ink-500 transition hover:border-gold-400/70 hover:text-gold-400 disabled:border-gold-400/50 disabled:text-gold-400"
            >
              {f.id}
            </button>
          ))}
        </div>
        <h2 key={floor.id} className="mt-1 text-[22px] font-black tracking-[0.06em] [text-shadow:0_0_14px_#000] transition duration-1000 starting:opacity-0">
          {floor.sub}
        </h2>
        <div className="mt-2.5 mb-1.5 h-px w-14 bg-linear-to-r from-gold-400/70 to-transparent" />
        <p className="text-[11px] tracking-[0.08em] text-ink-400">{population}</p>
        {connection && <p className="mt-1 text-[11px] text-ruby-500">{connection}</p>}
        {notice && <p className="mt-1 text-[11px] text-ink-500">{notice}</p>}
      </div>
      <div className="absolute top-7 right-8 flex items-center gap-6 transition duration-700 ease-castle starting:translate-x-2 starting:opacity-0">
        <button
          type="button"
          onClick={onToggleView}
          aria-label={`시점 전환 (V), 지금 ${viewLabel(view)}`}
          className="focus-ring flex items-center gap-2 border-b border-gold-400/30 pb-0.5 text-[11px] tracking-[0.2em] text-ink-400 transition hover:border-gold-400/70 hover:text-gold-400"
        >
          <span className="border border-gold-400/40 px-1 font-sans text-[10px] leading-4 tracking-normal text-gold-400/80 pointer-coarse:hidden">V</span>
          {viewLabel(view)}
        </button>
        <Link to="/" className="focus-ring border-b border-gold-400/30 pb-0.5 text-[11px] tracking-[0.2em] text-ink-400 transition hover:border-gold-400/70 hover:text-gold-400">
          성을 나서다
        </Link>
      </div>
      {view === 'first' && (
        <>
          {/* 조준점 */}
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-1 -translate-1/2 rounded-full bg-gold-400/60 shadow-[0_0_6px_#000]" />
          {lookHint && (
            <p className="pointer-events-none absolute top-[56%] w-full text-center text-[11px] tracking-[0.15em] text-ink-300 [text-shadow:0_0_6px_#000] transition duration-500 starting:opacity-0">
              화면을 클릭하면 둘러볼 수 있습니다 · Esc 해제
            </p>
          )}
        </>
      )}
      <p className="pointer-events-none absolute bottom-[22px] left-8 flex items-center gap-2 text-[11px] tracking-[0.05em] text-ink-500 pointer-coarse:hidden">
        <Diamond className="opacity-60" />
        방향키 이동 · Shift 달리기 · Space 등롱
      </p>
    </>
  );
}
