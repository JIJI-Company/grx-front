import { EmptyState, LoadingState } from '../components/common/AsyncState';
import PageHeader from '../components/common/PageHeader';
import ScheduleCard from '../components/common/ScheduleCard';
import { useSchedule } from '../hooks/useContent';

const scheduleDateOptions: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

export default function SchedulePage() {
  const { data: items = [], isLoading } = useSchedule();

  return (
    <div className="page-wrap">
      <PageHeader title="INFINITE SCHEDULE" subtitle="무한성의 모든 작전 일정을 확인하세요" />
      {isLoading && <LoadingState />}
      {!isLoading && items.length === 0 && (
        <EmptyState icon="📅" message="현재 등록된 스케줄이 없습니다." />
      )}
      <div className="schedule-grid">
        {items.map((item) => (
          <ScheduleCard
            key={item.contentId}
            item={item}
            memberLimit={4}
            dateOptions={scheduleDateOptions}
            showCrewFallback
            showEndTime
            showSummary
            openExternalUrl
          />
        ))}
      </div>
    </div>
  );
}
