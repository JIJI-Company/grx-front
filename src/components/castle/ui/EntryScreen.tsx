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
      <form onSubmit={submit} className="grid w-full max-w-[360px] gap-6 text-center">
        <header>
          <p className="text-xs tracking-[0.4em] text-gold-400/60">GGU-CASTLE</p>
          <h1 className="mt-1.5 text-[40px] font-black">무한성으로</h1>
          <p className="text-[13px] text-ink-400">말 없이 함께 머무는 곳</p>
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
            className="border-0 border-b border-gold-400/40 bg-transparent p-2 text-center text-base text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-400"
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
              className={`focus-ring size-[22px] rounded-full border-2 transition ${c.value === hornColor ? 'border-ink-50' : 'border-transparent'}`}
              style={{ background: c.value }}
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
          className="focus-ring border border-gold-400/60 py-3 text-[15px] font-semibold tracking-[0.15em] text-gold-400 transition hover:bg-gold-400/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          내려가기
        </button>
        <p className="text-[11px] text-ink-500">방향키 이동 · Shift 달리기 · Space 등롱 바치기</p>
      </form>
    </div>
  );
}
