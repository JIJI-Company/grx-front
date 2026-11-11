// 방송 각성 알림: 화면 구석에 잠깐
import { useEffect, useState } from 'react';

const VISIBLE_MS = 5000;

export default function AwakenToast({ message, seq }: { message: string | null; seq: number }) {
  const [shownSeq, setShownSeq] = useState<number | null>(null);
  useEffect(() => {
    if (!message) return;
    setShownSeq(seq);
    const t = setTimeout(() => setShownSeq(null), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [message, seq]);
  if (!message || shownSeq !== seq) return null;
  return (
    <div
      key={shownSeq}
      className="pointer-events-none absolute top-28 right-8 text-right transition duration-700 ease-castle starting:translate-x-3 starting:opacity-0"
      role="status"
    >
      <div className="mb-2 flex items-center justify-end gap-2">
        <span aria-hidden className="h-px w-12 bg-linear-to-l from-ruby-500/80 to-transparent" />
        <span aria-hidden className="size-1 rotate-45 bg-ruby-500/80" />
      </div>
      <p className="text-sm tracking-[0.06em] text-ink-50 [text-shadow:0_0_8px_#000,0_0_18px_rgb(225_29_72/0.45)]">{message}</p>
    </div>
  );
}
