import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Member } from '../../api/types';
import { getMemberColor } from '../../utils/memberColor';
import MemberModal from './MemberModal';
import { getMemberRankLabel, MEMBER_TIER_META } from './memberPresentation';
import type { MemberTierTone } from './memberPresentation';

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

interface MemberCastleSceneProps {
  master: Member[];
  upper: Member[];
  lower: Member[];
  newMembers: Member[];
}

function MemberImageFrame({
  member,
  active,
  onClick,
  className = '',
}: {
  member: Member;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  const color = getMemberColor(member);
  const rankLabel = getMemberRankLabel(member);

  return (
    <button
      type="button"
      className={`image_cont member-image-frame ${className} ${active ? 'is-active' : ''}`}
      onClick={onClick}
      style={{ '--member-color': color } as CSSProperties}
      aria-pressed={active}
      aria-label={`${member.stageName} 상세 보기`}
    >
      {member.profileAsset?.publicUrl && (
        <img
          src={member.profileAsset.publicUrl}
          alt={member.stageName}
          loading="lazy"
          decoding="async"
        />
      )}
      <span className="member-image-caption">
        <span className="member-image-rank">{rankLabel}</span>
        <span className="member-image-name">{member.stageName}</span>
      </span>
    </button>
  );
}

function TierScene({
  label,
  tone,
  color,
}: {
  label: string;
  tone: MemberTierTone;
  color: string;
}) {
  return (
    <section
      className={`image_cont member-tier-scene member-tier-scene-${tone}`}
      style={{ '--tier-color': color } as CSSProperties}
    >
      <img
        data-speed="auto"
        src="/img/infinite-castle-abyss-v2.png"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <h2>{label}</h2>
    </section>
  );
}

function MemberImageGrid({
  members,
  activeId,
  onSelect,
  label,
  tone,
}: {
  members: Member[];
  activeId: string | undefined;
  onSelect: (member: Member) => void;
  label: string;
  tone: MemberTierTone;
}) {
  if (members.length === 0) return null;

  return (
    <section className={`container member-card-grid member-card-grid-${tone}`} aria-label={label}>
      {members.map((member) => (
        <MemberImageFrame
          key={member.memberId}
          member={member}
          active={activeId === member.memberId}
          onClick={() => onSelect(member)}
          className={getMemberFrameClass(member, tone)}
        />
      ))}
    </section>
  );
}

function getMemberFrameClass(member: Member, tone: MemberTierTone): string {
  if (tone !== 'new') return '';
  const order = Math.min(Math.max(member.displayOrder, 1), 6);
  return `member-pot-frame member-pot-frame-${order}`;
}

export default function MemberCastleScene({
  master,
  upper,
  lower,
  newMembers,
}: MemberCastleSceneProps) {
  const allMembers = useMemo(
    () => [...master, ...upper, ...lower, ...newMembers],
    [lower, master, newMembers, upper],
  );
  const [modalMemberId, setModalMemberId] = useState<string | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const modalMember = allMembers.find((member) => member.memberId === modalMemberId);
  const tierMembers: Record<MemberTierTone, Member[]> = { upper, lower, new: newMembers };

  useEffect(() => {
    if (!wrapperRef.current) return undefined;

    ScrollSmoother.get()?.kill();

    const smoother = ScrollSmoother.create({
      wrapper: '#members-smooth-wrapper',
      content: '#members-smooth-content',
      smooth: 1,
      effects: true,
    });

    const cards = gsap.utils.toArray<HTMLElement>('.member-images-layout .member-image-frame');
    gsap.set(cards, { y: 64, autoAlpha: 0 });
    const revealTriggers = ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'transform,opacity,visibility',
        }),
    });

    ScrollTrigger.refresh();

    return () => {
      revealTriggers.forEach((trigger) => trigger.kill());
      smoother.kill();
    };
  }, []);

  return (
    <>
      <div id="members-smooth-wrapper" className="members-smooth-wrapper" ref={wrapperRef}>
        <div id="members-smooth-content" className="members-smooth-content">
          <section className="castle-abyss-wrap member-images-layout" aria-label="무한성 멤버 이미지 구조">
            <div className="castle-bg-layer-far" />

            <section className="image-grid container member-reference-grid member-intro-grid">
              <div className="image_cont member-mood-hero">
                <img
                  data-speed="auto"
                  src="/img/infinite-castle-abyss-v2.png"
                  alt=""
                  loading="eager"
                  decoding="async"
                />
                <div className="member-mood-copy">
                  <span>MEMBERS</span>
                  <strong>무한성의 뒷모습</strong>
                </div>
              </div>
            </section>

            {master.length > 0 && (
              <section className="member-master-stage" aria-label="MASTER">
                <div className="member-master-copy">
                  <span>MASTER</span>
                  <strong>마스터</strong>
                </div>
                <MemberImageFrame
                  member={master[0]}
                  active={modalMember?.memberId === master[0].memberId}
                  onClick={() => setModalMemberId(master[0].memberId)}
                  className="member-master-photo"
                />
              </section>
            )}

            {MEMBER_TIER_META.map(({ tone, label, color }) =>
              tierMembers[tone].length > 0 ? (
                <Fragment key={tone}>
                  <TierScene label={label} tone={tone} color={color} />
                  <MemberImageGrid
                    members={tierMembers[tone]}
                    activeId={modalMemberId}
                    onSelect={(member) => setModalMemberId(member.memberId)}
                    label={`${label} 이미지 목록`}
                    tone={tone}
                  />
                </Fragment>
              ) : null,
            )}
          </section>
        </div>
      </div>
      {modalMember && <MemberModal member={modalMember} onClose={() => setModalMemberId(undefined)} />}
    </>
  );
}
