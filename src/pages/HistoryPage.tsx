import { useMemo, useState } from 'react';
import { LoadingState } from '../components/common/AsyncState';
import CardSlider from '../components/history/CardSlider';
import {
  buildHistoryMemberProfileMap,
  categoriesInData,
  categoryMeta,
  countMedals,
} from '../components/history/historyPresentation';
import { useHistory, useNotice } from '../hooks/useContent';
import { useMembers } from '../hooks/useMembers';

export default function HistoryPage() {
  const { data: items = [], isLoading } = useHistory();
  const { data: groupedMembers } = useMembers();
  const { data: streamers = [] } = useNotice();
  const [activeCat, setActiveCat] = useState('all');

  const memberProfiles = useMemo(
    () => buildHistoryMemberProfileMap(groupedMembers, streamers),
    [groupedMembers, streamers],
  );
  const totals = useMemo(() => countMedals(items), [items]);
  const categories = useMemo(() => categoriesInData(items), [items]);
  const filtered = useMemo(
    () => (activeCat === 'all' ? items : items.filter((a) => a.category === activeCat)),
    [items, activeCat],
  );
  const catCounts = useMemo(() => countMedals(filtered), [filtered]);

  return (
    <>
      <header className="hof-hero text-center">
        <div className="hof-glow" aria-hidden="true" />
        <span className="hof-label">RECORD OF GLORY</span>
        <h1 className="hof-title font-display">
          GRX<span className="bar">|</span>HISTORY
        </h1>
        <p className="hof-sub">꾸한성 크루의 영광스러운 기록들</p>
        <div className="hof-scroll" aria-hidden="true">
          <span />
        </div>
      </header>

      <div className="page-wrap">
        {isLoading && <LoadingState />}

      {/* ── 명예의 전당 ── */}
      <section className="hof-section">
        <SectionHeader title="🏆 HALL OF FAME" desc="대회 수상 기록 전체 하이라이트" />
        <div className="hof-stats">
          <Stat tone="gold" value={totals.gold} label="🥇 GOLD" />
          <Stat tone="silver" value={totals.silver} label="🥈 SILVER" />
          <Stat tone="bronze" value={totals.bronze} label="🥉 BRONZE" />
          <Stat tone="total" value={totals.total} label="🏆 TOTAL" />
        </div>
        <CardSlider items={items} memberProfiles={memberProfiles} />
      </section>

      {/* ── 카테고리별 기록 ── */}
      <section className="hof-section">
        <SectionHeader title="📋 BY CATEGORY" desc="게임 카테고리별 수상 기록" />
        <div className="hof-tabs">
          <button
            className={`hof-tab ${activeCat === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCat('all')}
          >
            🏆 ALL
          </button>
          {categories.map((category) => {
            const meta = categoryMeta(category);
            return (
              <button
                key={category}
                className={`hof-tab ${activeCat === category ? 'active' : ''}`}
                onClick={() => setActiveCat(category)}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
        <div className="hof-cat-stats">
          {catCounts.gold > 0 && (
            <span className="hof-cat-badge gold">🥇 금메달 {catCounts.gold}개</span>
          )}
          {catCounts.silver > 0 && (
            <span className="hof-cat-badge silver">🥈 은메달 {catCounts.silver}개</span>
          )}
          {catCounts.bronze > 0 && (
            <span className="hof-cat-badge bronze">🥉 동메달 {catCounts.bronze}개</span>
          )}
          {catCounts.total > 0 && (
            <span className="hof-cat-badge total">🏆 총 {catCounts.total}개</span>
          )}
        </div>
        <CardSlider items={filtered} memberProfiles={memberProfiles} />
      </section>
      </div>
    </>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <div className="hof-header">
        <div className="hof-header-line" />
        <h2 className="hof-header-title">{title}</h2>
        <div className="hof-header-line" />
      </div>
      <p className="hof-header-desc">{desc}</p>
    </>
  );
}

function Stat({
  tone,
  value,
  label,
}: {
  tone: 'gold' | 'silver' | 'bronze' | 'total';
  value: number;
  label: string;
}) {
  return (
    <div className={`hof-stat ${tone}`}>
      <span className="hof-stat-num">{value}</span>
      <span className="hof-stat-label">{label}</span>
    </div>
  );
}
