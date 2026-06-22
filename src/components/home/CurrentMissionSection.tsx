import type { LiveStatus, NoticeStreamer } from '../../api/types';
import LiveStatusPanel from './LiveStatusPanel';
import NoticePreview from './NoticePreview';

interface CurrentMissionSectionProps {
  liveData: LiveStatus[];
  notices: NoticeStreamer[];
}

export default function CurrentMissionSection({
  liveData,
  notices,
}: CurrentMissionSectionProps) {
  return (
    <div className="page-shell updates-section animate-fade-in">
      <h2 className="section-title">CURRENT MISSION</h2>
      <div className="updates-grid">
        <LiveStatusPanel data={liveData} />
        <NoticePreview streamers={notices} />
      </div>
    </div>
  );
}
