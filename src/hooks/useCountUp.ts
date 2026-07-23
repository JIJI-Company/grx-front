import { useEffect, useRef, useState } from 'react';

/**
 * target까지 rAF로 증가하는 카운트 값을 반환한다.
 * target이 null이면(실데이터 대기) 애니메이션 없이 null을 반환한다.
 */
export function useCountUp(target: number | null, durationMs = 1200): number | null {
  const [value, setValue] = useState<number | null>(target === null ? null : 0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return undefined;
    }

    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}
