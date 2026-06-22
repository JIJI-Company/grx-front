import { useMemo, useState } from 'react';
import type { NoticeStreamer } from '../api/types';
import { EmptyState, LoadingState } from '../components/common/AsyncState';
import PageHeader from '../components/common/PageHeader';
import NoticeCard from '../components/notice/NoticeCard';
import { useNotice } from '../hooks/useContent';

export default function NoticePage() {
  const { data: streamers = [], isLoading, isError } = useNotice();
  const [activeId, setActiveId] = useState('ALL');

  const visible = useMemo(
    () => (activeId === 'ALL' ? streamers : streamers.filter((s) => s.soopId === activeId)),
    [streamers, activeId],
  );

  return (
    <div className="page-wrap">
      <PageHeader title="NOTICE" subtitle="스트리머들이 올린 최신 공지를 한곳에서" />

      {isLoading && <LoadingState message="무한성 통신망을 통해 공지를 불러오는 중..." />}
      {isError && <EmptyState icon="📡" message="공지 데이터를 불러오지 못했습니다." />}
      {!isLoading && !isError && streamers.length === 0 && (
        <EmptyState icon="📭" message="등록된 공지가 없습니다." />
      )}

      {streamers.length > 0 && (
        <>
          <div className="notice-tabs">
            <button
              className={`notice-tab ${activeId === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveId('ALL')}
            >
              전체 보기
            </button>
            {streamers.map((s) => (
              <button
                key={s.soopId}
                className={`notice-tab ${activeId === s.soopId ? 'active' : ''}`}
                onClick={() => setActiveId(s.soopId)}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="notice-groups">
            {visible.map((streamer) => (
              <StreamerGroup key={streamer.soopId} streamer={streamer} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StreamerGroup({ streamer }: { streamer: NoticeStreamer }) {
  return (
    <section className="notice-group">
      <header className="notice-group-header" style={{ borderColor: `${streamer.color}55` }}>
        <a href={streamer.boardUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={streamer.avatar}
            alt={streamer.name}
            style={{ borderColor: streamer.color }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        </a>
        <h2>
          {streamer.name}
          <span>님의 최근 공지사항</span>
        </h2>
      </header>
      <div className="notice-grid">
        {streamer.notices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} accent={streamer.color} />
        ))}
      </div>
    </section>
  );
}
