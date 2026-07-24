import { useEffect, useState, type CSSProperties } from 'react';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import { useCountUp } from '../../hooks/useCountUp';
import { useNotice } from '../../hooks/useContent';
import { useChallengeBalloonTotals } from '../../hooks/useChallengeMissions';
import {
  CUMULATIVE_STAT,
  GLOBAL_PLEDGES,
  GLOBAL_REWARDS,
  MARCH_ICON_SRC,
  MARCH_PATH_POINTS,
  MILESTONES,
} from './samgukjiData';
import type { CampaignStat } from './samgukjiData';
import {
  buildBalloonByName,
  buildMarchBands,
  buildMarchEntries,
  buildNoticeAvatarMap,
  buildNoticeSoopMap,
  collectSoopIds,
  formatPledgeTarget,
  getMilestonePositionPercent,
  getNextMilestone,
  getPledgeStatusMeta,
  indexBalloonBySoop,
  isStatPending,
  MARCH_BAND_THRESHOLD,
  resolveMarcherIcon,
  resolvePledgeStatus,
  sumBalloonTotals,
} from './samgukjiPresentation';
import type { MarchBand, MarchEntry } from './samgukjiPresentation';

interface SamgukjiStatusProps {
  members: Member[];
  onSelectMember: (name: string) => void;
}

export default function SamgukjiStatus({ members, onSelectMember }: SamgukjiStatusProps) {
  const [previewGroup, setPreviewGroup] = useState<number | null>(null);
  const [pinnedGroup, setPinnedGroup] = useState<number | null>(null);
  const { data: streamers } = useNotice();
  const nameToSoop = buildNoticeSoopMap(streamers);
  const soopIds = collectSoopIds(members, nameToSoop);
  const { data: balloonTotals, isLoading } = useChallengeBalloonTotals(soopIds);

  const avatarMap = buildNoticeAvatarMap(streamers);
  const balloonByName = buildBalloonByName(members, nameToSoop, indexBalloonBySoop(balloonTotals));
  const entries = buildMarchEntries(members, balloonByName, MARCH_ICON_SRC);
  const bands = buildMarchBands(entries, MILESTONES, MARCH_BAND_THRESHOLD);
  const total = isLoading ? null : sumBalloonTotals(balloonByName);
  const activeGroup = previewGroup ?? pinnedGroup;

  // 펼쳐진 밴드(pinnedGroup)는 Esc / 밴드·마일스톤 바깥 클릭으로 닫는다.
  useEffect(() => {
    if (pinnedGroup === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPinnedGroup(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.sgj-band') && !target?.closest('.sgj-milestone')) {
        setPinnedGroup(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [pinnedGroup]);

  const toggleGroup = (index: number) =>
    setPinnedGroup((current) => (current === index ? null : index));

  return (
    <div className="sgj-status">
      <section className="sgj-counter-single" aria-label="누적 API 현황">
        <CounterCard stat={{ ...CUMULATIVE_STAT, value: total }} />
      </section>

      <section className="sgj-global-pledges" aria-labelledby="global-pledges-title">
        <h2 id="global-pledges-title" className="sgj-panel-title">
          전체 누적 공약
        </h2>
        <ul className="sgj-pledge-list">
          {GLOBAL_PLEDGES.map((pledge) => {
            const status = getPledgeStatusMeta(resolvePledgeStatus(pledge.targetCount, total));
            return (
              <li key={pledge.id} className="sgj-pledge-row">
                <div className="sgj-pledge-target">
                  <strong>{formatPledgeTarget(pledge.targetCount)}</strong>
                </div>
                <div className="sgj-pledge-content">
                  <div className="sgj-pledge-row-top">
                    <strong>{pledge.title}</strong>
                    <span className={`sgj-badge sgj-badge-${status.tone}`}>
                      {status.label}
                    </span>
                  </div>
                  {pledge.detail && <p>{pledge.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
        {GLOBAL_REWARDS.map((item) => (
          <div key={item.id} className="sgj-global-reward">
            <span>{item.audience}</span>
            <strong>{item.reward}</strong>
          </div>
        ))}
      </section>

      <section className="sgj-march" aria-label="공약 달리기 현황">
        <h2 className="sgj-panel-title">공약 달리기 현황</h2>
        <p className="sgj-march-hint">장수를 눌러 공약첩을 펼쳐보세요.</p>
        <div className="sgj-track">
          <div className="sgj-track-canvas">
            <div className="sgj-track-inner">
              {MILESTONES.map((milestone, index) => (
                <button
                  key={milestone.value}
                  type="button"
                  className={`sgj-milestone${activeGroup === index ? ' is-active' : ''}`}
                  style={{
                    left: `${getMilestonePositionPercent(index, MILESTONES)}%`,
                    top: `${MARCH_PATH_POINTS[index]?.y ?? 80}%`,
                  }}
                  aria-label={`${milestone.label} 구간 멤버 강조`}
                  aria-pressed={pinnedGroup === index}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setPreviewGroup(index);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setPreviewGroup(null);
                  }}
                  onFocus={() => setPreviewGroup(index)}
                  onBlur={() => setPreviewGroup(null)}
                  onClick={() => toggleGroup(index)}
                >
                  <span className="sgj-milestone-dot" aria-hidden="true" />
                  <span className="sgj-milestone-label">{milestone.label}</span>
                </button>
              ))}

              {bands.map((band) => {
                if (band.members.length === 0) return null;
                const left = getMilestonePositionPercent(band.index, MILESTONES);
                const isActive = activeGroup === band.index;
                const isExpanded = pinnedGroup === band.index;
                return (
                  <div
                    key={band.milestone.value}
                    className={`sgj-band${isActive ? ' is-active' : ''}`}
                    style={{ left: `${left}%` }}
                  >
                    {band.collapsed ? (
                      <BandBadge
                        band={band}
                        avatarMap={avatarMap}
                        expanded={isExpanded}
                        onToggle={() => toggleGroup(band.index)}
                      />
                    ) : (
                      band.members.map((entry) => (
                        <MarcherAvatar
                          key={entry.member.memberId}
                          entry={entry}
                          avatarMap={avatarMap}
                          onSelect={onSelectMember}
                        />
                      ))
                    )}
                    {band.collapsed && isExpanded ? (
                      <BandPopover
                        band={band}
                        avatarMap={avatarMap}
                        onSelect={onSelectMember}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** 밴드 팝오버 정렬 — 첫/끝 칸은 트랙 밖으로 넘치지 않게 좌/우 정렬한다. */
function popoverAlign(index: number): 'start' | 'center' | 'end' {
  if (index === 0) return 'start';
  if (index === MILESTONES.length - 1) return 'end';
  return 'center';
}

function BandBadge({
  band,
  avatarMap,
  expanded,
  onToggle,
}: {
  band: MarchBand;
  avatarMap: Map<string, string>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const preview = band.members.slice(0, 2);
  return (
    <button
      type="button"
      className={`sgj-band-badge${expanded ? ' is-expanded' : ''}`}
      aria-expanded={expanded}
      aria-label={`${band.milestone.label} 구간 ${band.members.length}명 ${expanded ? '접기' : '펼치기'}`}
      onClick={onToggle}
    >
      <span className="sgj-band-badge-avatars" aria-hidden="true">
        {preview.map((entry) => {
          const icon = resolveMarcherIcon(entry, avatarMap.get(entry.member.stageName));
          return icon ? (
            <img key={entry.member.memberId} src={icon} alt="" loading="lazy" decoding="async" />
          ) : (
            <span key={entry.member.memberId} className="sgj-band-badge-fallback">
              {entry.member.stageName.slice(0, 1)}
            </span>
          );
        })}
      </span>
      <span className="sgj-band-badge-count">+{band.members.length}</span>
    </button>
  );
}

function BandPopover({
  band,
  avatarMap,
  onSelect,
}: {
  band: MarchBand;
  avatarMap: Map<string, string>;
  onSelect: (name: string) => void;
}) {
  return (
    <div
      className={`sgj-band-popover sgj-band-popover-${popoverAlign(band.index)}`}
      role="group"
      aria-label={`${band.milestone.label} 구간 ${band.members.length}명`}
    >
      <span className="sgj-band-popover-title">
        {band.milestone.label} · {band.members.length}명
      </span>
      <div className="sgj-band-popover-grid">
        {band.members.map((entry) => (
          <MarcherAvatar
            key={entry.member.memberId}
            entry={entry}
            avatarMap={avatarMap}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function MarcherAvatar({
  entry,
  avatarMap,
  onSelect,
}: {
  entry: MarchEntry;
  avatarMap: Map<string, string>;
  onSelect: (name: string) => void;
}) {
  const { member, current, balloonTotal } = entry;
  const color = getMemberColor(member);
  const next = getNextMilestone(current, MILESTONES);
  const icon = resolveMarcherIcon(entry, avatarMap.get(member.stageName));
  return (
    <button
      type="button"
      className="sgj-marcher"
      style={{ '--sgj-member': color } as CSSProperties}
      onClick={() => onSelect(member.stageName)}
      aria-label={`${member.stageName} 공약첩 열기 — 현재 ${current.toLocaleString('ko-KR')}, ${
        next ? `다음 목표 ${next.label}` : '최종 목표 달성'
      }`}
    >
      {icon ? (
        <img src={icon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      ) : (
        <span className="sgj-marcher-fallback" aria-hidden="true">
          {member.stageName.slice(0, 1)}
        </span>
      )}
      <span className="sgj-marcher-name">{member.stageName}</span>
      <span className="sgj-marcher-count" aria-hidden="true">
        {balloonTotal === null ? '—' : balloonTotal.toLocaleString('ko-KR')}
      </span>
    </button>
  );
}

function CounterCard({ stat }: { stat: CampaignStat }) {
  const pending = isStatPending(stat);
  const count = useCountUp(stat.value);

  return (
    <div className={`sgj-counter${pending ? ' sgj-counter-pending' : ''}`}>
      <span className="sgj-counter-label">{stat.label}</span>
      <span className="sgj-counter-value">
        {pending || count === null
          ? '대기중'
          : `${count.toLocaleString('ko-KR')}${stat.suffix}`}
      </span>
      <span className="sgj-counter-note">진행 중 도전미션 모금 별풍선</span>
    </div>
  );
}
