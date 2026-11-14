// 성(채널) 선택. 박스 없이 텍스트와 얇은 금선만.
import type { CastleHallSummary } from '../../../api/types';
import { hallPopulationLabel } from '../castlePresentation';

interface HallPickerProps {
  halls: CastleHallSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  value: string | null;
  onChange: (slug: string) => void;
}

export default function HallPicker({ halls, isLoading, isError, value, onChange }: HallPickerProps) {
  if (isLoading) return <p className="text-xs text-ink-500">성의 위치를 찾는 중…</p>;
  if (isError || !halls?.length) return <p className="text-xs text-ruby-500">성 목록을 불러오지 못했습니다</p>;
  return (
    <div role="radiogroup" aria-label="성 선택" className="grid gap-1">
      {halls.map((hall) => {
        const selected = hall.slug === value;
        return (
          <button
            key={hall.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={hall.isFull}
            onClick={() => onChange(hall.slug)}
            className={`focus-ring flex items-center justify-between border-b px-1 py-2 text-sm transition duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              selected ? 'border-gold-400/70 bg-linear-to-r from-gold-400/5 to-transparent text-gold-400' : 'border-gold-400/15 text-ink-300 hover:border-gold-400/35 hover:text-ink-50'
            }`}
          >
            <span className="flex items-center gap-2 tracking-[0.2em]">
              <span aria-hidden className={`size-1 rotate-45 bg-gold-400 transition-opacity duration-300 ${selected ? 'opacity-90' : 'opacity-0'}`} />
              {hall.name}
            </span>
            <span className="text-[11px] text-ink-500">{hallPopulationLabel(hall)}</span>
          </button>
        );
      })}
    </div>
  );
}
