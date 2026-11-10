// 층 이동 연출: 페이드(계단은 검정, 해치는 붉은빛) + 층 이름
import type { FloorDef } from '../../../castle/floors';

export default function FloorTransition({ fade, opaque, banner }: { fade: string; opaque: boolean; banner: FloorDef | null }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-[800ms] ease-castle"
        style={{ background: fade, opacity: opaque ? 1 : 0 }}
      />
      {banner && (
        <div className="pointer-events-none absolute top-[38%] w-full text-center" role="status">
          <p className="text-[13px] tracking-[0.6em] text-gold-400/60">{banner.title}</p>
          <p className="text-[40px] font-black [text-shadow:0_0_20px_#000]">{banner.sub}</p>
        </div>
      )}
    </>
  );
}
