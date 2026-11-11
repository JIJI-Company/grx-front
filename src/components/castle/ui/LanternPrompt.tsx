// 석상 앞 상호작용 힌트. 키보드는 Space(등롱)·E(정보) 힌트, 터치는 오른쪽 아래 버튼 2개.
interface LanternPromptProps {
  label: string;
  infoLabel: string;
  onOffer: () => void;
  onInfo: () => void;
}

export default function LanternPrompt({ label, infoLabel, onOffer, onInfo }: LanternPromptProps) {
  return (
    <>
      <p
        className="pointer-events-none absolute bottom-[70px] flex w-full items-center justify-center text-sm tracking-[0.04em] text-gold-400/90 [text-shadow:0_0_8px_#000] transition duration-500 ease-castle pointer-coarse:hidden starting:translate-y-1.5 starting:opacity-0"
        aria-live="polite"
      >
        <span aria-hidden className="mr-4 h-px w-10 bg-linear-to-l from-gold-400/50 to-transparent" />
        <span className="mr-2.5 border border-gold-400/60 bg-castle-950/50 px-2 py-px font-sans text-[11px]">Space</span>
        {label}
        <span className="mr-2.5 ml-6 border border-gold-400/60 bg-castle-950/50 px-2 py-px font-sans text-[11px]">E</span>
        {infoLabel}
        <span aria-hidden className="ml-4 h-px w-10 bg-linear-to-r from-gold-400/50 to-transparent" />
      </p>
      <div className="absolute right-8 bottom-10 hidden flex-col items-end gap-2 transition duration-500 ease-castle pointer-coarse:flex starting:translate-x-2 starting:opacity-0">
        <button
          type="button"
          onClick={onInfo}
          className="focus-ring border border-gold-400/40 bg-castle-950/50 px-4 py-2 text-xs tracking-[0.06em] text-gold-400/80 backdrop-blur-[2px] transition active:bg-gold-400/10"
        >
          {infoLabel}
        </button>
        <button
          type="button"
          onClick={onOffer}
          className="focus-ring border border-gold-400/60 bg-castle-950/50 px-4 py-3 text-sm tracking-[0.06em] text-gold-400 shadow-[0_0_18px_rgb(250_204_21/0.12)] backdrop-blur-[2px] transition active:bg-gold-400/10"
        >
          {label}
        </button>
      </div>
    </>
  );
}
