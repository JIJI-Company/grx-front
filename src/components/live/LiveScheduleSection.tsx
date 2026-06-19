import type { ContentItem } from '../../api/types';
import ScheduleCard from '../common/ScheduleCard';

interface LiveScheduleSectionProps {
  items: ContentItem[];
}

export default function LiveScheduleSection({ items }: LiveScheduleSectionProps) {
  if (items.length === 0) return null;

  return (
    <>
      <h2 className="section-title mt-15">📅 LIVE SCHEDULE</h2>
      <div className="schedule-grid">
        {items.slice(0, 6).map((item) => (
          <ScheduleCard key={item.contentId} item={item} />
        ))}
      </div>
    </>
  );
}
