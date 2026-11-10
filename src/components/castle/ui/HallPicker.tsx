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
            className={`focus-ring flex items-baseline justify-between border-b px-1 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
              selected ? 'border-gold-400/70 text-gold-400' : 'border-gold-400/15 text-ink-300 hover:text-ink-50'
            }`}
          >
            <span className="tracking-[0.2em]">{hall.name}</span>
            <span className="text-[11px] text-ink-500">{hallPopulationLabel(hall)}</span>
          </button>
        );
      })}
    </div>
  );
}
