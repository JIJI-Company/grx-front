import { useRef } from 'react';
import type { HistoryAchievement } from '../../api/types';
import AchievementCard from './AchievementCard';
import type { HistoryMemberProfileMap } from './historyPresentation';
import { sortByMedal } from './historyPresentation';

interface CardSliderProps {
  items: HistoryAchievement[];
  memberProfiles: HistoryMemberProfileMap;
}

export default function CardSlider({ items, memberProfiles }: CardSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sorted = sortByMedal(items);

  const slide = (direction: number) => {
    trackRef.current?.scrollBy({ left: direction * 310, behavior: 'smooth' });
  };

  return (
    <div className="hof-slider">
      <button className="hof-arrow left" onClick={() => slide(-1)} aria-label="이전 기록">
        ❮
      </button>
      <div className="hof-track" ref={trackRef}>
        {sorted.length === 0 ? (
          <div className="hof-empty">
            <span aria-hidden="true">🏆</span>
            <p>아직 수상 기록이 없습니다</p>
          </div>
        ) : (
          sorted.map((item) => (
            <AchievementCard
              key={item.id}
              item={item}
              memberProfiles={memberProfiles}
            />
          ))
        )}
      </div>
      <button className="hof-arrow right" onClick={() => slide(1)} aria-label="다음 기록">
        ❯
      </button>
    </div>
  );
}
