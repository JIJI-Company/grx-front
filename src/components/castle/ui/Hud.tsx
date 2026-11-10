// 층 HUD: 박스 없이 텍스트와 얇은 금선만
import { Link } from 'react-router-dom';
import type { FloorDef } from '../../../castle/floors';

interface HudProps {
  floor: FloorDef;
  population: string;
  connection: string | null;
  notice: string | null;
}

export default function Hud({ floor, population, connection, notice }: HudProps) {
  return (
    <>
      <div className="pointer-events-none absolute top-7 left-8">
        <p className="text-xs tracking-[0.3em] text-gold-400/60">{floor.id}</p>
        <h2 className="mt-0.5 text-[22px] font-black">{floor.sub}</h2>
        <div className="mt-2.5 mb-1.5 h-px w-10 bg-gold-400/50" />
        <p className="text-[11px] text-ink-400">{population}</p>
        {connection && <p className="mt-1 text-[11px] text-ruby-500">{connection}</p>}
        {notice && <p className="mt-1 text-[11px] text-ink-500">{notice}</p>}
      </div>
      <Link to="/" className="focus-ring absolute top-7 right-8 border-b border-gold-400/30 pb-0.5 text-[11px] tracking-[0.2em] text-ink-400 transition hover:text-gold-400">
        성을 나서다
      </Link>
      <p className="pointer-events-none absolute bottom-[22px] left-8 text-[11px] text-ink-500 pointer-coarse:hidden">방향키 이동 · Shift 달리기 · Space 등롱</p>
    </>
  );
}
