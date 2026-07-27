import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import { useChallengeBalloonTotals } from '../../hooks/useChallengeMissions';
import { useNotice } from '../../hooks/useContent';
import {
  buildBalloonByName,
  buildNoticeAvatarMap,
  buildMemberSoopMap,
  collectSoopIds,
  indexBalloonBySoop,
} from './samgukjiPresentation';

const POLL_INTERVAL = 60_000;
const CLOSE_BATTLE_THRESHOLD = 1_000;
const DESIGN_WIDTH = 680;
const FLIP_DURATION = '0.8s';
const FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface RankedEntry {
  member: Member;
  balloonTotal: number | null;
  rank: number;
  gapToAbove: number | null;
  isCloseBattle: boolean;
}

interface SamgukjiLeaderboardProps {
  members: Member[];
  onSelectMember: (name: string) => void;
}

export default function SamgukjiLeaderboard({
  members,
  onSelectMember,
}: SamgukjiLeaderboardProps) {
  const scaleRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = scaleRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setZoom(w >= DESIGN_WIDTH ? 1 : w / DESIGN_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: streamers } = useNotice();
  const nameToSoop = buildMemberSoopMap(members);
  const soopIds = collectSoopIds(members, nameToSoop);
  const { data: balloonTotals, dataUpdatedAt } = useChallengeBalloonTotals(
    soopIds,
    POLL_INTERVAL,
  );

  const avatarMap = buildNoticeAvatarMap(streamers);
  const balloonByName = buildBalloonByName(
    members,
    nameToSoop,
    indexBalloonBySoop(balloonTotals),
  );

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const prevOrderRef = useRef<string[]>([]);
  const ranked: RankedEntry[] = useMemo(() => {
    const entries = members.map((member) => ({
      member,
      balloonTotal: balloonByName.get(member.stageName) ?? null,
    }));

    entries.sort((a, b) => (b.balloonTotal ?? -1) - (a.balloonTotal ?? -1));

    return entries.map((entry, i) => {
      const rank = i + 1;
      const above = i > 0 ? entries[i - 1].balloonTotal : null;
      const cur = entry.balloonTotal;
      const gapToAbove = above != null && cur != null ? above - cur : null;
      const isCloseBattle = gapToAbove != null && gapToAbove <= CLOSE_BATTLE_THRESHOLD;

      return { ...entry, rank, gapToAbove, isCloseBattle };
    });
  }, [members, balloonByName]);

  useEffect(() => {
    const rects = new Map<string, DOMRect>();
    for (const [id, el] of cardRefs.current) {
      rects.set(id, el.getBoundingClientRect());
    }
    prevRectsRef.current = rects;
  });

  useLayoutEffect(() => {
    const currentOrder = ranked.map((r) => r.member.memberId);
    const prevOrder = prevOrderRef.current;
    prevOrderRef.current = currentOrder;

    if (prevOrder.length === 0) return;
    if (currentOrder.every((id, i) => prevOrder[i] === id)) return;

    const prevRects = prevRectsRef.current;
    if (prevRects.size === 0) return;

    for (const [id, el] of cardRefs.current) {
      const prevRect = prevRects.get(id);
      if (!prevRect) continue;

      const newRect = el.getBoundingClientRect();
      const deltaY = prevRect.top - newRect.top;
      const deltaX = prevRect.left - newRect.left;

      if (Math.abs(deltaY) < 2 && Math.abs(deltaX) < 2) continue;

      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = 'none';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${FLIP_DURATION} ${FLIP_EASING}`;
          el.style.transform = '';
          el.addEventListener(
            'transitionend',
            () => {
              el.classList.add('sgj-lb-landed');
              setTimeout(() => el.classList.remove('sgj-lb-landed'), 1200);
            },
            { once: true },
          );
        });
      });
    }
  }, [ranked]);

  const setCardRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const updatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div ref={scaleRef} className="sgj-lb-scale">
      <div className="sgj-lb" style={zoom < 1 ? { zoom } : undefined}>
        <div className="sgj-lb-header">
          <h2 className="sgj-panel-title">실시간 순위</h2>
          {updatedLabel && (
            <span className="sgj-lb-updated">
              마지막 갱신 {updatedLabel}
            </span>
          )}
        </div>

        <p className="sgj-lb-hint">
          {POLL_INTERVAL / 1000}초마다 자동 갱신 · 장수를 눌러 공약첩 열기
        </p>

        <div className="sgj-lb-podium">
          {ranked.slice(0, 3).map((entry) => (
            <PodiumCard
              key={entry.member.memberId}
              entry={entry}
              avatar={avatarMap.get(entry.member.stageName)}
              onSelect={onSelectMember}
              setRef={setCardRef}
            />
          ))}
        </div>

        <ol className="sgj-lb-list">
          {ranked.slice(3).map((entry) => (
            <RankRow
              key={entry.member.memberId}
              entry={entry}
              avatar={avatarMap.get(entry.member.stageName)}
              onSelect={onSelectMember}
              setRef={setCardRef}
            />
          ))}
        </ol>

        <PollDot interval={POLL_INTERVAL} updatedAt={dataUpdatedAt} />
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  avatar,
  onSelect,
  setRef,
}: {
  entry: RankedEntry;
  avatar: string | undefined;
  onSelect: (name: string) => void;
  setRef: (id: string, el: HTMLElement | null) => void;
}) {
  const { member, balloonTotal, rank, gapToAbove, isCloseBattle } = entry;
  const color = getMemberColor(member);
  const icon = avatar || member.profileAsset?.publicUrl;
  const medalClass = rank <= 3 ? ` sgj-lb-medal-${rank}` : '';

  return (
    <button
      type="button"
      ref={(el) => setRef(member.memberId, el)}
      className={`sgj-lb-podium-card${medalClass}`}
      style={{ '--sgj-member': color } as CSSProperties}
      onClick={() => onSelect(member.stageName)}
    >
      <span className="sgj-lb-rank">{rank}</span>
      <div className="sgj-lb-podium-avatar">
        {icon ? (
          <img src={icon} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="sgj-lb-avatar-fallback">
            {member.stageName.slice(0, 1)}
          </span>
        )}
      </div>
      <span className="sgj-lb-name">{member.stageName}</span>
      <span className="sgj-lb-count">
        <AnimatedCount value={balloonTotal} />
      </span>
      {gapToAbove != null && rank > 1 && (
        <GapIndicator gap={gapToAbove} isClose={isCloseBattle} />
      )}
    </button>
  );
}

function RankRow({
  entry,
  avatar,
  onSelect,
  setRef,
}: {
  entry: RankedEntry;
  avatar: string | undefined;
  onSelect: (name: string) => void;
  setRef: (id: string, el: HTMLElement | null) => void;
}) {
  const { member, balloonTotal, rank, gapToAbove, isCloseBattle } = entry;
  const color = getMemberColor(member);
  const icon = avatar || member.profileAsset?.publicUrl;

  return (
    <li>
      <button
        type="button"
        ref={(el) => setRef(member.memberId, el)}
        className="sgj-lb-row"
        style={{ '--sgj-member': color } as CSSProperties}
        onClick={() => onSelect(member.stageName)}
      >
        <span className="sgj-lb-row-rank">
          {rank}
        </span>
        <div className="sgj-lb-row-avatar">
          {icon ? (
            <img src={icon} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="sgj-lb-avatar-fallback">
              {member.stageName.slice(0, 1)}
            </span>
          )}
        </div>
        <span className="sgj-lb-row-name">{member.stageName}</span>
        <GapIndicator gap={gapToAbove} isClose={isCloseBattle} compact />
        <span className="sgj-lb-row-count">
          <AnimatedCount value={balloonTotal} />
        </span>
      </button>
    </li>
  );
}

function GapIndicator({
  gap,
  isClose,
  compact,
}: {
  gap: number | null;
  isClose: boolean;
  compact?: boolean;
}) {
  if (gap === null) return null;
  if (isClose) {
    return (
      <span className={`sgj-lb-close${compact ? ' sgj-lb-close-compact' : ''}`}>
        ⚔ 접전 <span className="sgj-lb-close-gap">-{gap.toLocaleString('ko-KR')}</span>
      </span>
    );
  }
  return (
    <span className={`sgj-lb-gap${compact ? ' sgj-lb-gap-compact' : ''}`}>
      -{gap.toLocaleString('ko-KR')}
    </span>
  );
}

function AnimatedCount({ value }: { value: number | null }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    if (value === null) {
      setDisplay(null);
      prevRef.current = null;
      return;
    }
    const from = prevRef.current ?? 0;
    prevRef.current = value;
    if (from === value) {
      setDisplay(value);
      return;
    }
    const duration = 800;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  if (display === null) return <span>—</span>;
  return <span>{display.toLocaleString('ko-KR')}</span>;
}

function PollDot({
  interval,
  updatedAt,
}: {
  interval: number;
  updatedAt: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - updatedAt;
      setProgress(Math.min(elapsed / interval, 1));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [updatedAt, interval]);

  return (
    <div className="sgj-lb-poll" aria-hidden="true">
      <div className="sgj-lb-poll-bar" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
