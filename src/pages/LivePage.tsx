import PageHeader from '../components/common/PageHeader';
import LiveGrid from '../components/live/LiveGrid';
import LiveScheduleSection from '../components/live/LiveScheduleSection';
import { useSchedule } from '../hooks/useContent';
import { useLiveStatus } from '../hooks/useLive';

export default function LivePage() {
  const { data: liveData = [], isLoading } = useLiveStatus();
  const { data: scheduleItems = [] } = useSchedule();

  return (
    <div className="page-wrap">
      <PageHeader
        title="LIVE CASTLE"
        subtitle="무한성의 대시보드에서 실시간 방송 상태를 확인하십시오."
      />
      <LiveGrid streams={liveData} isLoading={isLoading} />
      <LiveScheduleSection items={scheduleItems} />
    </div>
  );
}
