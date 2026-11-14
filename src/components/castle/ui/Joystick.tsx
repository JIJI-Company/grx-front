// 모바일 가상 조이스틱 (터치 기기에서만 보임). 오프셋을 -1~1로 정규화해 입력에 넘긴다.
import { useRef, useState, type PointerEvent } from 'react';
import type { MoveInput } from '../../../castle/input';

const RADIUS = 48;

export default function Joystick({ input }: { input: MoveInput }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    let dx = e.clientX - origin.current.x;
    let dy = e.clientY - origin.current.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    input.setJoystick(dx / RADIUS, dy / RADIUS);
  };
  const start = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e);
  };
  const end = () => {
    origin.current = null;
    setKnob({ x: 0, y: 0 });
    input.setJoystick(0, 0);
  };

  return (
    <div
      aria-hidden
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute bottom-10 left-8 hidden size-28 touch-none rounded-full border border-gold-400/30 pointer-coarse:block"
    >
      <div
        className="absolute top-1/2 left-1/2 size-11 rounded-full border border-gold-400/60 bg-gold-400/10"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
