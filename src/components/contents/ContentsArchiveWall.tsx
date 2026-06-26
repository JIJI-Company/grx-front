import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import type { ContentsArchiveItem } from '../../api/types';
import { useContentsArchive } from '../../hooks/useContent';
import { useMembers } from '../../hooks/useMembers';
import styles from './ContentsArchiveWall.module.css';

const ALL_MEMBER = '전체';
const FALLBACK_IMAGE = '/img/ggu_title.jpg';

const BASE_MEMBERS = [
  { name: ALL_MEMBER, avatar: null },
  { name: '꾸티뉴', avatar: '/img/ggutinho.png' },
  { name: '엔쥬', avatar: '/img/enju.png' },
  { name: '난워니', avatar: '/img/nanana.png' },
  { name: '야무지', avatar: '/img/yamuzi.png' },
  { name: '리카', avatar: '/img/lika.png' },
  { name: '다뮤', avatar: '/img/damu.jpeg' },
  { name: '딴딴2당', avatar: '/img/ttanttan.jpeg' },
  { name: '바먀', avatar: '/img/baamya.png' },
  { name: '김옥독', avatar: '/img/okdok.png' },
  { name: '냥쏘', avatar: '/img/nangsso.png' },
  { name: '윤타미', avatar: '/img/tami.png' },
  { name: '임민트', avatar: '/img/mint.png' },
  { name: '란다', avatar: '/img/randa.jpg' },
  { name: '서라0', avatar: '/img/서라0.jpg' },
  { name: '모야', avatar: '/img/moya.png' },
  { name: '소심해', avatar: '/img/sosim.jpeg' },
];

type MemberProfile = {
  name: string;
  avatar: string | null;
};

type StoryRailDragState = {
  pointerId: number | null;
  startX: number;
  startScrollLeft: number;
  didDrag: boolean;
};

function useStoryRailDrag() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<StoryRailDragState>({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    didDrag: false,
  });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const pointerId = dragRef.current.pointerId;
    if (pointerId === null || pointerId !== event.pointerId) return;

    const didDrag = dragRef.current.didDrag;
    dragRef.current.pointerId = null;
    dragRef.current.didDrag = false;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }

    if (didDrag) {
      suppressClickRef.current = true;
    }
  };

  return {
    railRef,
    isDragging,
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      const rail = railRef.current;
      if (event.button !== 0 || !rail || rail.scrollWidth <= rail.clientWidth) return;

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: rail.scrollLeft,
        didDrag: false,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const rail = railRef.current;
      const drag = dragRef.current;
      if (!rail || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      if (Math.abs(deltaX) > 4) {
        drag.didDrag = true;
      }

      if (drag.didDrag) {
        event.preventDefault();
      }

      rail.scrollLeft = drag.startScrollLeft - deltaX;
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (!suppressClickRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    },
  };
}

function useContentsIntroAnimations(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-feed-profile]', {
        y: 24,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('[data-story-item]', {
        x: 24,
        opacity: 0,
        stagger: 0.035,
        duration: 0.55,
        delay: 0.16,
        ease: 'power3.out',
      });

      gsap.from('[data-feed-post]', {
        y: 34,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.7,
        stagger: 0.055,
        delay: 0.22,
        ease: 'power3.out',
      });
    }, rootRef);

    return () => ctx.revert();
  }, [rootRef]);
}

function useContentsViewTransition(rootRef: RefObject<HTMLElement | null>, selectedMember: string) {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!rootRef.current) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from('[data-member-grid], [data-feed-post]', {
        y: 24,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.45,
        stagger: 0.035,
        ease: 'power3.out',
      });
    }, rootRef);

    return () => ctx.revert();
  }, [rootRef, selectedMember]);
}

function buildMembers(items: ContentsArchiveItem[]): MemberProfile[] {
  const known = new Set(BASE_MEMBERS.map((member) => member.name));
  const extras = Array.from(new Set(items.flatMap((item) => item.members)))
    .filter((name) => name && !known.has(name))
    .map((name) => ({ name, avatar: null }));

  return [...BASE_MEMBERS, ...extras];
}

function getSelectedProfile(members: MemberProfile[], selectedMember: string) {
  return members.find((member) => member.name === selectedMember) || members[0];
}

function getPostsByMember(items: ContentsArchiveItem[], selectedMember: string) {
  if (selectedMember === ALL_MEMBER) return items;
  return items.filter((post) => post.members.includes(selectedMember));
}

function formatDisplayDate(value: string) {
  if (!value) return '상시 진행';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function postMembers(post: ContentsArchiveItem) {
  return post.members.length > 0 ? post.members.join(' · ') : 'GGU CASTLE';
}

function postTags(post: ContentsArchiveItem) {
  return post.tags;
}

function openPost(post: ContentsArchiveItem) {
  if (!post.url) return;
  window.open(post.url, '_blank', 'noopener,noreferrer');
}

function ProfileHeader({
  postCount,
  creatorCount,
}: {
  postCount: number;
  creatorCount: number;
}) {
  return (
    <header className={styles.profile} data-feed-profile>
      <div className={styles.profileAvatar}>GC</div>
      <div className={styles.profileCopy}>
        <h1>@ggu_castle.contents</h1>
        <p>꾸한성 크루원들이 만든 방송 콘텐츠를 피드처럼 모아보는 곳</p>
        <div className={styles.stats}>
          <span><b>{postCount}</b> posts</span>
          <span><b>{creatorCount}</b> creators</span>
          <span><b>SOOP</b> archive</span>
        </div>
      </div>
    </header>
  );
}

function StoryRail({
  members,
  selectedMember,
  onSelectMember,
}: {
  members: MemberProfile[];
  selectedMember: string;
  onSelectMember: (member: string) => void;
}) {
  const drag = useStoryRailDrag();
  const className = `${styles.storyRail} ${drag.isDragging ? styles.storyRailDragging : ''}`;

  return (
    <div
      ref={drag.railRef}
      className={className}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
      onClickCapture={drag.onClickCapture}
    >
      {members.map((member) => (
        <StoryButton
          key={member.name}
          member={member}
          isActive={selectedMember === member.name}
          onSelect={onSelectMember}
        />
      ))}
    </div>
  );
}

function StoryButton({
  member,
  isActive,
  onSelect,
}: {
  member: MemberProfile;
  isActive: boolean;
  onSelect: (member: string) => void;
}) {
  const className = `${styles.storyItem} ${isActive ? styles.storyItemActive : ''}`;

  return (
    <button
      className={className}
      data-story-item
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(member.name)}
    >
      <span className={styles.storyRing}>
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} draggable={false} />
        ) : (
          <span className={styles.allStory}>{member.name === ALL_MEMBER ? 'ALL' : member.name.slice(0, 1)}</span>
        )}
      </span>
      <span className={styles.storyName}>{member.name}</span>
    </button>
  );
}

function FeedList({ posts }: { posts: ContentsArchiveItem[] }) {
  return (
    <div className={styles.feedList}>
      {posts.map((post) => (
        <FeedPost post={post} key={post.id} />
      ))}
    </div>
  );
}

function FeedPost({ post }: { post: ContentsArchiveItem }) {
  const hasLink = Boolean(post.url);

  return (
    <article className={styles.feedPost} data-feed-post>
      <PostHeader post={post} />
      <button
        className={`${styles.media} ${hasLink ? styles.mediaLink : ''}`}
        type="button"
        disabled={!hasLink}
        onClick={() => openPost(post)}
        aria-label={hasLink ? `${post.title} 열기` : post.title}
      >
        <img src={post.imageUrl || FALLBACK_IMAGE} alt={post.title} />
      </button>
      <PostBody post={post} />
    </article>
  );
}

function PostHeader({ post }: { post: ContentsArchiveItem }) {
  return (
    <div className={styles.postHeader}>
      <div className={styles.postAuthor}>
        <div className={styles.smallAvatar}>GC</div>
        <div>
          <p>ggu_castle.contents</p>
          <span>{postMembers(post)} · {formatDisplayDate(post.date)}</span>
        </div>
      </div>
      <span className={styles.more}>•••</span>
    </div>
  );
}

function PostBody({ post }: { post: ContentsArchiveItem }) {
  const tags = postTags(post);

  return (
    <div className={styles.postBody}>
      <h2>{post.title}</h2>
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag}>#{tag.replace(/^#/, '')}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberGridView({
  profile,
  posts,
  onBackToAll,
}: {
  profile: MemberProfile;
  posts: ContentsArchiveItem[];
  onBackToAll: () => void;
}) {
  return (
    <div className={styles.memberGridView}>
      <MemberGridHeader profile={profile} postCount={posts.length} onBackToAll={onBackToAll} />
      {posts.length > 0 ? <MemberGrid posts={posts} /> : <EmptyGrid />}
    </div>
  );
}

function MemberGridHeader({
  profile,
  postCount,
  onBackToAll,
}: {
  profile: MemberProfile;
  postCount: number;
  onBackToAll: () => void;
}) {
  return (
    <div className={styles.memberGridHeader} data-member-grid>
      <div className={styles.memberGridAvatar}>
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name} />
        ) : (
          <span>{profile.name === ALL_MEMBER ? 'ALL' : profile.name.slice(0, 1)}</span>
        )}
      </div>
      <div className={styles.memberGridMeta}>
        <h2>@{profile.name}</h2>
        <p>선택한 멤버가 참여한 콘텐츠만 모아보기</p>
        <div>
          <span><b>{postCount}</b> posts</span>
          <span><b>GGU</b> creator</span>
        </div>
      </div>
      <button className={styles.backFeedButton} type="button" onClick={onBackToAll}>
        전체 피드
      </button>
    </div>
  );
}

function MemberGrid({ posts }: { posts: ContentsArchiveItem[] }) {
  return (
    <div className={styles.memberGrid}>
      {posts.map((post) => (
        <GridTile post={post} key={post.id} />
      ))}
    </div>
  );
}

function GridTile({ post }: { post: ContentsArchiveItem }) {
  return (
    <button
      className={styles.gridTile}
      type="button"
      data-member-grid
      onClick={() => openPost(post)}
      disabled={!post.url}
    >
      <img src={post.imageUrl || FALLBACK_IMAGE} alt={post.title} />
      <span className={styles.gridTileMeta}>
        <b>{post.title}</b>
        <small>{formatDisplayDate(post.date)}</small>
      </span>
    </button>
  );
}

function EmptyGrid() {
  return (
    <div className={styles.emptyGrid} data-member-grid>
      아직 등록된 참여 콘텐츠가 없습니다.
    </div>
  );
}

function ArchiveState({ children }: { children: ReactNode }) {
  return (
    <div className={styles.archiveState} data-feed-post>
      {children}
    </div>
  );
}

export default function ContentsArchiveWall() {
  const rootRef = useRef<HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState(ALL_MEMBER);
  const { data: items = [], isLoading, isError } = useContentsArchive();
  const { data: membersData } = useMembers();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const resetOnPageShow = () => {
      setSelectedMember(ALL_MEMBER);
    };

    window.addEventListener('pageshow', resetOnPageShow);

    return () => {
      window.removeEventListener('pageshow', resetOnPageShow);
    };
  }, []);

  const members = useMemo(() => {
    const list: MemberProfile[] = [{ name: ALL_MEMBER, avatar: null }];
    const seen = new Set<string>();

    if (membersData) {
      const all = [
        ...(membersData.master ?? []),
        ...(membersData.upper ?? []),
        ...(membersData.lower ?? []),
        ...(membersData.new ?? []),
        ...(membersData.other ?? []),
      ];
      all.forEach((m) => {
        list.push({
          name: m.stageName,
          avatar: m.profileAsset?.publicUrl ?? null,
        });
        seen.add(m.stageName);
      });
    } else {
      BASE_MEMBERS.forEach((m) => {
        if (m.name !== ALL_MEMBER) {
          list.push(m);
          seen.add(m.name);
        }
      });
    }

    const extras = Array.from(new Set(items.flatMap((item) => item.members)))
      .filter((name) => name && !seen.has(name))
      .map((name) => ({ name, avatar: null }));

    return [...list, ...extras];
  }, [membersData, items]);
  const selectedProfile = useMemo(() => getSelectedProfile(members, selectedMember), [members, selectedMember]);
  const selectedPosts = useMemo(() => getPostsByMember(items, selectedMember), [items, selectedMember]);
  const creatorCount = Math.max(members.length - 1, 0);
  const isAllView = selectedMember === ALL_MEMBER;

  useContentsIntroAnimations(rootRef);
  useContentsViewTransition(rootRef, selectedMember);

  return (
    <main ref={rootRef} className={styles.page}>
      <div className={styles.backgroundGlow} />

      <section className={styles.shell}>
        <ProfileHeader postCount={items.length} creatorCount={creatorCount} />
        <StoryRail members={members} selectedMember={selectedMember} onSelectMember={setSelectedMember} />
        {isLoading ? (
          <ArchiveState>콘텐츠를 불러오는 중입니다.</ArchiveState>
        ) : isError ? (
          <ArchiveState>콘텐츠를 불러오지 못했습니다.</ArchiveState>
        ) : isAllView ? (
          selectedPosts.length > 0 ? <FeedList posts={selectedPosts} /> : <ArchiveState>등록된 콘텐츠가 없습니다.</ArchiveState>
        ) : (
          <MemberGridView
            profile={selectedProfile}
            posts={selectedPosts}
            onBackToAll={() => setSelectedMember(ALL_MEMBER)}
          />
        )}
      </section>
    </main>
  );
}
