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
      <p className="pointer-events-none absolute bottom-[70px] w-full text-center text-sm text-gold-400/90 [text-shadow:0_0_8px_#000] pointer-coarse:hidden" aria-live="polite">
        <span className="mr-2.5 border border-gold-400/60 px-2 py-px text-[11px]">Space</span>
        {label}
        <span className="mr-2.5 ml-6 border border-gold-400/60 px-2 py-px text-[11px]">E</span>
        {infoLabel}
      </p>
      <div className="absolute right-8 bottom-10 hidden flex-col items-end gap-2 pointer-coarse:flex">
        <button
          type="button"
          onClick={onInfo}
          className="focus-ring border border-gold-400/40 bg-castle-950/40 px-4 py-2 text-xs text-gold-400/80"
        >
          {infoLabel}
        </button>
        <button
          type="button"
          onClick={onOffer}
          className="focus-ring border border-gold-400/60 bg-castle-950/40 px-4 py-3 text-sm text-gold-400"
        >
          {label}
        </button>
      </div>
    </>
  );
}
