import { EmptyState, LoadingState } from '../components/common/AsyncState';
import PageHeader from '../components/common/PageHeader';
import HistoryCard from '../components/history/HistoryCard';
import { useHistory } from '../hooks/useContent';

export default function HistoryPage() {
  const { data: items = [], isLoading } = useHistory();

  return (
    <div className="history-page-wrap container">
      <PageHeader
        title="HISTORY"
        subtitle="무한성 크루의 명예의 전당 · 대회 기록"
      />
      {isLoading && <LoadingState />}
      {!isLoading && items.length === 0 && (
        <EmptyState icon="🏆" message="아직 등록된 기록이 없습니다." />
      )}
      <div className="history-grid">
        {items.map((item) => <HistoryCard key={item.contentId} item={item} />)}
      </div>
    </div>
  );
}
