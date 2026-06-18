import { EmptyState, LoadingState } from '../components/common/AsyncState';
import PageHeader from '../components/common/PageHeader';
import TimesItem from '../components/times/TimesItem';
import { useNews, useNotices } from '../hooks/useContent';

export default function TimesPage() {
  const { data: newsData, isLoading: newsLoading } = useNews(30);
  const { data: noticeData, isLoading: noticeLoading } = useNotices(10);
  const isLoading = newsLoading || noticeLoading;
  const items = [
    ...(newsData?.items ?? []),
    ...(noticeData?.items ?? []),
  ].sort((left, right) => {
    const leftDate = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightDate = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
    return rightDate - leftDate;
  });

  return (
    <div className="times-page-wrap container">
      <PageHeader
        title="TIMES"
        subtitle="꾸한타임즈 — 무한성의 소식을 전합니다"
        subtitleMarginBottom={40}
      />
      {isLoading && <LoadingState />}
      {!isLoading && items.length === 0 && (
        <EmptyState icon="📰" message="등록된 소식이 없습니다." />
      )}
      <div className="times-timeline">
        {items.map((item) => <TimesItem key={item.contentId} item={item} />)}
      </div>
    </div>
  );
}
