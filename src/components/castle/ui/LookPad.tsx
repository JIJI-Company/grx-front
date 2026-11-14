// 모바일 시점 회전: 화면 오른쪽 절반을 끌어서 둘러본다 (터치 기기에서만 보임).
// 1인칭은 둘러보기, 3인칭은 꾸로를 중심으로 카메라 회전, 석상 감상은 석상을 중심으로 회전 — 무엇을 돌릴지는 onTurn이 정한다.
import { useRef, type PointerEvent } from 'react';

export default function LookPad({ onTurn }: { onTurn: (dx: number, dy: number) => void }) {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  const start = (e: PointerEvent<HTMLDivElement>) => {
    last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const l = last.current;
    if (!l || l.id !== e.pointerId) return;
    onTurn(e.clientX - l.x, e.clientY - l.y);
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
