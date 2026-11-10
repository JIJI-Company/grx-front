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
    <div className="pointer-events-none absolute top-28 right-8 text-right" role="status">
      <div className="ml-auto mb-1.5 h-px w-10 bg-ruby-500/70" />
      <p className="text-sm text-ink-50 [text-shadow:0_0_8px_#000]">{message}</p>
    </div>
  );
}
