// 층 이동 연출: 계단은 어두워진 뒤 장지문이 좌우로 열리고, 해치는 붉게 덮이고, 복귀는 공간이 뒤집힌다.
// 3D 쪽 연출(다다미·낙하·카메라)은 같은 시각표(castle/transition.ts)를 캔버스 안에서 읽는다. 덮개는 HUD까지 가린다.
import type { CSSProperties, ReactNode } from 'react';
import type { FloorDef } from '../../../castle/floors';
import { coverStyle, shojiStyle, spaceStyle, type TransitionOverlay } from '../castlePresentation';

interface FloorTransitionProps {
  overlay: TransitionOverlay | null;
  banner: FloorDef | null;
  /** 3D 캔버스. 복귀 연출 때 통째로 회전한다 */
  children: ReactNode;
}

// 장지문: 뒤에서 등불이 비치는 종이 + 나무 살
const SHOJI: CSSProperties = {
  background: [
    'repeating-linear-gradient(90deg, #2a160c 0 5px, transparent 5px 96px)',
    'repeating-linear-gradient(0deg, #2a160c 0 5px, transparent 5px 72px)',
    'radial-gradient(ellipse at 50% 55%, #d9b98a 0%, #8a6640 55%, #2a170c 100%)',
  ].join(','),
  boxShadow: 'inset 0 0 0 14px #1c0e07, inset 0 0 60px rgb(0 0 0 / 0.6)',
};

export default function FloorTransition({ overlay, banner, children }: FloorTransitionProps) {
  return (
    <>
      <div className="absolute inset-0 isolate" style={spaceStyle(overlay)}>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10" style={coverStyle(overlay)} />
      {overlay?.kind === 'stairs' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex overflow-hidden" aria-hidden>
          {([-1, 1] as const).map((side) => (
            <div key={side} className="h-full w-1/2" style={{ ...SHOJI, ...shojiStyle(overlay, side) }} />
          ))}
        </div>
      )}
      {banner && (
        <div
          key={banner.id}
          className="pointer-events-none absolute top-[36%] z-10 w-full text-center transition-[opacity,translate,letter-spacing] delay-500 duration-[1400ms] ease-castle starting:translate-y-2 starting:opacity-0"
          role="status"
        >
          <p className="flex items-center justify-center gap-4 text-[12px] tracking-[0.6em] text-gold-400/70">
            <span className="h-px w-16 bg-linear-to-l from-gold-400/60 to-transparent" />
            {banner.title}
            <span className="h-px w-16 bg-linear-to-r from-gold-400/60 to-transparent" />
          </p>
          <p className="mt-2 text-[44px] font-black tracking-[0.12em] [text-shadow:0_0_24px_#000,0_0_48px_rgb(225_29_72/0.25)]">{banner.sub}</p>
          <span className="mx-auto mt-3 block size-1.5 rotate-45 bg-gold-400/70" />
        </div>
      )}
    </>
  );
}
