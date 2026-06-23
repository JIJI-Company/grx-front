import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { HistoryAchievement } from '../../api/types';
import {
  MEDAL_ICON,
  MEDAL_LABEL,
  categoryMeta,
  formatDate,
  getAchievementMemberProfiles,
} from './historyPresentation';
import type { HistoryMemberProfileMap } from './historyPresentation';

interface AchievementCardProps {
  item: HistoryAchievement;
  memberProfiles: HistoryMemberProfileMap;
}

interface PopoverPosition {
  left: number;
  top: number;
  placement: 'above' | 'below';
}

interface PointerPosition {
  x: number;
  y: number;
}

const HOVER_DELAY_MS = 800;
const POPOVER_MAX_WIDTH = 480;
const POPOVER_ESTIMATED_HEIGHT = 150;
const VIEWPORT_MARGIN = 16;
const POINTER_GAP = 18;

export default function AchievementCard({ item, memberProfiles }: AchievementCardProps) {
  const cat = categoryMeta(item.category);
  const profiles = getAchievementMemberProfiles(item.members, memberProfiles);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const pointerPositionRef = useRef<PointerPosition | null>(null);
  const tooltipId = useId();
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const showProfiles = () => {
    const card = cardRef.current;
    if (!card || profiles.length === 0) return;

    const rect = card.getBoundingClientRect();
    const pointer = pointerPositionRef.current ?? {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const popoverWidth = Math.min(POPOVER_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const minLeft = VIEWPORT_MARGIN + popoverWidth / 2;
    const maxLeft = window.innerWidth - VIEWPORT_MARGIN - popoverWidth / 2;
    const left = Math.min(Math.max(pointer.x, minLeft), maxLeft);
    const placement =
      pointer.y > POPOVER_ESTIMATED_HEIGHT + VIEWPORT_MARGIN + POINTER_GAP
        ? 'above'
        : 'below';

    setPopoverPosition({
      left,
      top: placement === 'above' ? pointer.y - POINTER_GAP : pointer.y + POINTER_GAP,
      placement,
    });
  };

  const startHoverTimer = (event: ReactMouseEvent<HTMLDivElement>) => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(showProfiles, HOVER_DELAY_MS);
  };

  const trackPointer = (event: ReactMouseEvent<HTMLDivElement>) => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  const hideProfiles = () => {
    clearHoverTimer();
    pointerPositionRef.current = null;
    setPopoverPosition(null);
  };

  const toggleFlip = () => {
    if (!item.image) return;
    hideProfiles();
    setIsFlipped((current) => !current);
  };

  useEffect(() => clearHoverTimer, []);

  return (
    <>
      <div
        ref={cardRef}
        className={`medal-card ${item.medal} ${isFlipped ? 'is-flipped' : ''}`}
        tabIndex={profiles.length > 0 || item.image ? 0 : undefined}
        role={item.image ? 'button' : undefined}
        aria-label={item.image ? `${item.title} 카드 ${isFlipped ? '앞면' : '뒷면'} 보기` : undefined}
        aria-pressed={item.image ? isFlipped : undefined}
        aria-describedby={popoverPosition ? tooltipId : undefined}
        onMouseEnter={startHoverTimer}
        onMouseMove={trackPointer}
        onMouseLeave={hideProfiles}
        onFocus={showProfiles}
        onBlur={hideProfiles}
        onClick={toggleFlip}
        onKeyDown={(event) => {
          if (item.image && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            toggleFlip();
          }
        }}
      >
        <div className="medal-card-inner">
          <div className="medal-card-face medal-card-front">
            <div className="medal-card-label">{MEDAL_LABEL[item.medal] ?? 'ACHIEVEMENT'}</div>
            <div className="medal-card-icon">
              {MEDAL_ICON[item.medal] ? (
                <img src={MEDAL_ICON[item.medal]} alt={`${MEDAL_LABEL[item.medal]} medal`} />
              ) : (
                <span aria-hidden="true">🏆</span>
              )}
            </div>
            <div className="medal-card-title">{item.title}</div>
            <div className="medal-card-divider" />
            <div className="medal-card-date">{formatDate(item.date)}</div>
            <div className="medal-card-type">
              {cat.emoji} {cat.label}
            </div>
          </div>
          <div className="medal-card-face medal-card-back" aria-hidden={!isFlipped}>
            {item.image && <img src={item.image} alt={`${item.title} 팬아트`} loading="lazy" />}
            <div className="medal-card-back-caption">{item.title}</div>
          </div>
        </div>
      </div>
      {popoverPosition &&
        createPortal(
          <div
            id={tooltipId}
            className={`history-member-popover ${popoverPosition.placement}`}
            style={{ left: popoverPosition.left, top: popoverPosition.top }}
            role="tooltip"
          >
            {profiles.map((profile) => (
              <div key={profile.name} className="history-member-profile">
                <img
                  src={profile.avatar}
                  alt=""
                  className="history-member-avatar"
                  style={{ borderColor: profile.personalColor }}
                />
                <span
                  className="history-member-name"
                  style={{
                    backgroundColor: profile.personalColor,
                    color: profile.labelTextColor,
                  }}
                >
                  {profile.name}
                </span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
