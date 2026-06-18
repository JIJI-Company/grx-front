import type { ContentItem, LiveStatus } from '../../api/types';
import LiveStatusPanel from './LiveStatusPanel';
import SchedulePreview from './SchedulePreview';

interface CurrentMissionSectionProps {
  liveData: LiveStatus[];
  scheduleItems: ContentItem[];
}

export default function CurrentMissionSection({
  liveData,
  scheduleItems,
}: CurrentMissionSectionProps) {
  return (
    <div className="container updates-section animate-fade-in">
      <h2 className="section-title">CURRENT MISSION</h2>
      <div className="updates-grid">
        <LiveStatusPanel data={liveData} />
        <SchedulePreview items={scheduleItems} />
      </div>
    </div>
  );
}
