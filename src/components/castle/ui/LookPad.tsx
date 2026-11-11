// 모바일 1인칭 시점 회전: 화면 오른쪽 절반을 끌어서 둘러본다 (터치 기기에서만 보임).
import { useRef, type PointerEvent } from 'react';
import { TOUCH_SENSITIVITY, type LookInput } from '../../../castle/input';

export default function LookPad({ look }: { look: LookInput }) {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  const start = (e: PointerEvent<HTMLDivElement>) => {
    last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const l = last.current;
    if (!l || l.id !== e.pointerId) return;
    look.turn(e.clientX - l.x, e.clientY - l.y, TOUCH_SENSITIVITY);
    last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const end = () => (last.current = null);
  return (
    <div
      aria-hidden
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute top-0 right-0 hidden h-full w-1/2 touch-none pointer-coarse:block"
    />
  );
}
