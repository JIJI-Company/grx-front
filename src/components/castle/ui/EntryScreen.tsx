// 입장 화면: 닉네임 · 뿔 색 · 성 선택
import { useEffect, useState, type FormEvent } from 'react';
import type { JoinProfile } from '../../../castle/session';
import { useCastleHalls } from '../../../hooks/useCastle';
import { DEFAULT_NICKNAME, HORN_COLORS, NICKNAME_MAX } from '../castlePresentation';
import HallPicker from './HallPicker';

interface EntryScreenProps {
  onEnter: (profile: JoinProfile) => void;
  /** 직전 입장이 거절된 이유 (닉네임 금칙어·정원 초과) */
  rejection: string | null;
  initial: JoinProfile | null;
}

export default function EntryScreen({ onEnter, rejection, initial }: EntryScreenProps) {
  const halls = useCastleHalls();
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [hornColor, setHornColor] = useState<string>(initial?.hornColor ?? HORN_COLORS[0].value);
  const [hallSlug, setHallSlug] = useState<string | null>(initial?.hall ?? null);

  useEffect(() => {
    if (hallSlug || !halls.data) return;
    setHallSlug(halls.data.find((h) => !h.isFull)?.slug ?? null);
  }, [halls.data, hallSlug]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!hallSlug) return;
    onEnter({ hall: hallSlug, nickname: nickname.trim() || DEFAULT_NICKNAME, hornColor });
  };

  return (
    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_40%,#2a0510,var(--color-castle-950)_70%)] px-6">
      <form
        onSubmit={submit}
        className="relative grid w-full max-w-[380px] gap-6 px-8 py-10 text-center transition duration-1000 ease-castle starting:translate-y-3 starting:opacity-0"
      >
        {/* 네 모서리 금선 장식 */}
        {['top-0 left-0 border-t border-l', 'top-0 right-0 border-t border-r', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map((c) => (
          <span key={c} aria-hidden className={`pointer-events-none absolute size-5 border-gold-400/50 ${c}`} />
        ))}
        <header>
          <p className="flex items-center justify-center gap-3 text-xs tracking-[0.4em] text-gold-400/60">
            <span aria-hidden className="h-px w-8 bg-linear-to-l from-gold-400/60 to-transparent" />
            GGU-CASTLE
            <span aria-hidden className="h-px w-8 bg-linear-to-r from-gold-400/60 to-transparent" />
          </p>
          <h1 className="mt-2 text-[42px] font-black tracking-[0.08em] [text-shadow:0_0_28px_rgb(225_29_72/0.35)]">무한성으로</h1>
          <p className="mt-1 text-[13px] tracking-[0.1em] text-ink-400">말 없이 함께 머무는 곳</p>
          <span aria-hidden className="mx-auto mt-4 block size-1.5 rotate-45 bg-gold-400/60" />
        </header>

        <label className="grid gap-1">
          <span className="sr-only">닉네임</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={NICKNAME_MAX}
            autoComplete="off"
            aria-invalid={rejection ? true : undefined}
            aria-describedby={rejection ? 'castle-entry-error' : undefined}
            className="border-0 border-b border-gold-400/40 bg-transparent p-2 text-center text-base tracking-[0.08em] text-ink-50 outline-none transition-colors placeholder:text-ink-500 focus:border-gold-400"
          />
        </label>

        <div role="radiogroup" aria-label="뿔 색" className="flex justify-center gap-3">
          {HORN_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={c.value === hornColor}
              aria-label={c.label}
              onClick={() => setHornColor(c.value)}
              className={`focus-ring size-[22px] rounded-full border-2 transition duration-300 ${
                c.value === hornColor ? 'scale-110 border-ink-50' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
              style={{ background: c.value, boxShadow: c.value === hornColor ? `0 0 12px ${c.value}` : undefined }}
            />
          ))}
        </div>

        {rejection && (
          <p id="castle-entry-error" role="alert" className="-mt-3 text-xs text-ruby-500">
            {rejection}
          </p>
        )}

        <HallPicker halls={halls.data} isLoading={halls.isLoading} isError={halls.isError} value={hallSlug} onChange={setHallSlug} />

        <button
          type="submit"
          disabled={!hallSlug}
          className="focus-ring group relative border border-gold-400/60 py-3 text-[15px] font-semibold tracking-[0.15em] text-gold-400 transition duration-300 hover:border-gold-400 hover:bg-gold-400/5 hover:tracking-[0.25em] disabled:cursor-not-allowed disabled:opacity-40"
        >
          내려가기
        </button>
        <p className="text-[11px] tracking-[0.05em] text-ink-500">방향키 이동 · Shift 달리기 · Space 등롱 바치기</p>
      </form>
    </div>
  );
}
