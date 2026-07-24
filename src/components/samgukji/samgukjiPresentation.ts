// 삼국지 공약 — 표현 로직(순수 함수). 화면(컴포넌트)과 분리된 데이터 가공 계층.
// 입력은 도메인 타입, 출력은 표시용 값. 부수효과 없음.
// OOP 4대 특징의 grx 관용구 실현:
//  - 추상화: 소비자는 Pledge/CampaignStat 등 interface 계약에만 의존.
//  - 캡슐화: 분기·정규화 로직을 이 모듈에 격리하고 순수 함수만 export.
//  - 다형성: PledgeStatus에 대한 Record 디스패치 테이블로 변형별 출력.
//  - 상속: PledgeBase를 extends한 Pledge를 그대로 소비.

import type {
  ChallengeBalloonTotal,
  Member,
  MembersGrouped,
  NoticeStreamer,
} from '../../api/types';
import type {
  CampaignStat,
  MilestoneMarker,
  Pledge,
  ResolvedPledge,
  PledgeStatus,
} from './samgukjiData';
import { MARCH_PATH_POINTS, SAMGUKJI_EXCLUDED } from './samgukjiData';

// ─── 멤버 로스터 평탄화 (그룹 → 단일 리스트) ─────────────────────────────────────

export function flattenMembers(grouped: MembersGrouped | undefined): Member[] {
  if (!grouped) return [];
  return [
    ...(grouped.master ?? []),
    ...(grouped.upper ?? []),
    ...(grouped.lower ?? []),
    ...(grouped.new ?? []),
    ...(grouped.other ?? []),
  ];
}

export function indexMembersByName(members: Member[]): Map<string, Member> {
  return new Map(members.map((m) => [m.stageName, m]));
}

/** 로스터 SSoT에서 삼국지 화면 대상 멤버만 남긴다(소심해 등 제외, 순서 보존). */
export function selectSamgukjiMembers(members: Member[]): Member[] {
  return members.filter(
    (m) => !SAMGUKJI_EXCLUDED.has(m.stageName) && !SAMGUKJI_EXCLUDED.has(m.slug),
  );
}

// ─── 별풍선 합계 색인 (soopId → 이름) ────────────────────────────────────────────

/** notice 스트리머의 soopId를 멤버 이름으로 색인(빈 값 제외). */
export function buildNoticeSoopMap(streamers: NoticeStreamer[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of streamers ?? []) {
    if (s.soopId && s.soopId.trim()) map.set(s.name, s.soopId);
  }
  return map;
}

/** 로스터에서 조회 대상 soopId 목록을 만든다(중복 제거, notice에 없는 멤버는 제외). */
export function collectSoopIds(members: Member[], nameToSoop: Map<string, string>): string[] {
  const ids = new Set<string>();
  for (const m of members) {
    const id = nameToSoop.get(m.stageName);
    if (id) ids.add(id);
  }
  return [...ids];
}

/** 별풍선 합계 응답을 soopId로 색인. */
export function indexBalloonBySoop(
  totals: ChallengeBalloonTotal[] | undefined,
): Map<string, number | null> {
  return new Map((totals ?? []).map((t) => [t.soopId, t.balloonTotal]));
}

/** 멤버 이름 → 별풍선 합계(number|null). notice soopId가 없으면 null(조회 불가). */
export function buildBalloonByName(
  members: Member[],
  nameToSoop: Map<string, string>,
  balloonBySoop: Map<string, number | null>,
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const m of members) {
    const soopId = nameToSoop.get(m.stageName);
    map.set(m.stageName, soopId ? balloonBySoop.get(soopId) ?? null : null);
  }
  return map;
}

/** 전 멤버 별풍선 합계의 총합. 값이 하나도 없으면(전원 null/미로드) null(대기중). */
export function sumBalloonTotals(balloonByName: Map<string, number | null>): number | null {
  let sum = 0;
  let hasValue = false;
  for (const v of balloonByName.values()) {
    if (v !== null) {
      sum += v;
      hasValue = true;
    }
  }
  return hasValue ? sum : null;
}

// ─── 진군 엔트리 (로스터 × 실데이터 별풍선 합계 merge) ────────────────────────────

/** 화면용 진군 엔트리 — 멤버(로스터) + 별풍선 합계 + 트랙 위치용 수치 + (옵션) 장수 아이콘. */
export interface MarchEntry {
  member: Member;
  /** 트랙 위치 계산용(조회 불가/0이면 0 = 트랙 시작점). */
  current: number;
  /** 실데이터 원본. 조회 불가와 0을 구분하기 위해 null 유지. */
  balloonTotal: number | null;
  iconSrc?: string;
}

/**
 * 로스터 멤버 각각에 실데이터 별풍선 합계를 이름으로 merge한다.
 * 조회 불가(null) 멤버는 current 0(트랙 시작점)으로 두되 balloonTotal은 null로 구분 유지.
 */
export function buildMarchEntries(
  members: Member[],
  balloonByName: Map<string, number | null>,
  iconByName: Record<string, string>,
): MarchEntry[] {
  return members.map((member) => {
    const balloonTotal = balloonByName.get(member.stageName) ?? null;
    return {
      member,
      current: balloonTotal ?? 0,
      balloonTotal,
      iconSrc: iconByName[member.stageName],
    };
  });
}

/** notice 스트리머 아바타를 멤버 이름으로 색인(빈 값 제외). */
export function buildNoticeAvatarMap(streamers: NoticeStreamer[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of streamers ?? []) {
    if (s.avatar && s.avatar.trim()) map.set(s.name, s.avatar);
  }
  return map;
}

/**
 * 마커에 쓸 아이콘 URL을 우선순위로 해석한다.
 * 정적 iconSrc(향후 말 탄 장수 아이콘) → notice 아바타 → 멤버 프로필 → null(이니셜 폴백).
 */
export function resolveMarcherIcon(
  entry: MarchEntry,
  noticeAvatar: string | undefined,
): string | null {
  if (entry.iconSrc) return entry.iconSrc;
  if (noticeAvatar && noticeAvatar.trim()) return noticeAvatar;
  return entry.member.profileAsset?.publicUrl ?? null;
}

// ─── 다형성: 공약 상태 메타 ──────────────────────────────────────────────────────

export interface PledgeStatusMeta {
  label: string;
  tone: 'achieved' | 'active' | 'idle';
}

const PLEDGE_STATUS_META: Record<PledgeStatus, PledgeStatusMeta> = {
  achieved: { label: '함락(달성)', tone: 'achieved' },
  'in-progress': { label: '진군 중', tone: 'active' },
  pending: { label: '대기중', tone: 'idle' },
};

export function getPledgeStatusMeta(status: PledgeStatus): PledgeStatusMeta {
  return PLEDGE_STATUS_META[status];
}

/** 공약 카드에서 목표 수치를 빠르게 읽을 수 있도록 만 단위로 축약한다. */
export function formatPledgeTarget(targetCount: number | null): string {
  if (targetCount === null) return '미설정';
  if (targetCount >= 10000 && targetCount % 10000 === 0) {
    return `${targetCount / 10000}만`;
  }
  return targetCount.toLocaleString('ko-KR');
}

export function resolvePledgeStatus(
  targetCount: number | null,
  currentCount: number | null,
): PledgeStatus {
  if (targetCount === null || currentCount === null) return 'pending';
  return currentCount >= targetCount ? 'achieved' : 'in-progress';
}

// ─── 공약 집계·분류 ──────────────────────────────────────────────────────────────

export function groupPledgesByMember(pledges: Pledge[]): Map<string, Pledge[]> {
  const map = new Map<string, Pledge[]>();
  for (const pledge of pledges) {
    const list = map.get(pledge.memberName) ?? [];
    list.push(pledge);
    map.set(pledge.memberName, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.targetCount ?? Infinity) - (b.targetCount ?? Infinity));
  }
  return map;
}

/** 저장된 별풍선 스냅샷과 목표 갯수를 비교해 화면용 달성 상태를 계산한다. */
export function resolvePledges(
  pledges: Pledge[],
  snapshot: ChallengeBalloonTotal | undefined,
): ResolvedPledge[] {
  return pledges.map((pledge) => {
    const status = resolvePledgeStatus(pledge.targetCount, snapshot?.balloonTotal ?? null);
    return {
      ...pledge,
      status,
      achievedAt: status === 'achieved' ? snapshot?.updatedAt?.slice(0, 10) ?? null : null,
    };
  });
}

// ─── 누적 수치 포맷 ──────────────────────────────────────────────────────────────

/** value가 null이면 실데이터 대기 상태. */
export function isStatPending(stat: CampaignStat): boolean {
  return stat.value === null;
}

export function formatStatValue(stat: CampaignStat): string {
  if (stat.value === null) return '대기중';
  return `${stat.value.toLocaleString('ko-KR')}${stat.suffix}`;
}

// ─── 진군 트랙 위치 계산 ─────────────────────────────────────────────────────────

/**
 * current 도달치를 마일스톤 등간격 트랙(0~100%) 위 위치로 환산한다.
 * 값 크기 차이가 커도 정거장이 고르게 보이도록 마일스톤 인덱스 기준 보간.
 */
export function getMarchPositionPercent(
  current: number,
  milestones: MilestoneMarker[],
): number {
  if (milestones.length === 0 || MARCH_PATH_POINTS.length !== milestones.length) return 0;
  const first = milestones[0].value;
  const last = milestones[milestones.length - 1].value;
  if (current <= first) return MARCH_PATH_POINTS[0].x;
  if (current >= last) return MARCH_PATH_POINTS[MARCH_PATH_POINTS.length - 1].x;

  const lastIndex = milestones.length - 1;
  for (let k = 0; k < lastIndex; k += 1) {
    const lo = milestones[k].value;
    const hi = milestones[k + 1].value;
    if (current >= lo && current < hi) {
      const frac = (current - lo) / (hi - lo);
      const start = MARCH_PATH_POINTS[k].x;
      const end = MARCH_PATH_POINTS[k + 1].x;
      return start + (end - start) * frac;
    }
  }
  return MARCH_PATH_POINTS[MARCH_PATH_POINTS.length - 1].x;
}

export function getMilestonePositionPercent(
  index: number,
  milestones: MilestoneMarker[],
): number {
  if (MARCH_PATH_POINTS.length !== milestones.length) return 0;
  return MARCH_PATH_POINTS[index]?.x ?? 0;
}

export function getNextMilestone(
  current: number,
  milestones: MilestoneMarker[],
): MilestoneMarker | null {
  return milestones.find((m) => m.value > current) ?? null;
}

export function getMarchGroupIndex(
  balloonTotal: number | null,
  milestones: MilestoneMarker[],
): number | null {
  if (balloonTotal === null || milestones.length === 0) return null;

  let groupIndex = 0;
  for (let index = 1; index < milestones.length; index += 1) {
    if (balloonTotal < milestones[index].value) break;
    groupIndex = index;
  }
  return groupIndex;
}

// ─── 밴드(마일스톤 칸) 그룹핑 ─────────────────────────────────────────────────

/** 밴드 접기 임계치 — 한 칸 인원이 이 수를 초과하면 +N 뱃지로 접는다. 조정 가능. */
export const MARCH_BAND_THRESHOLD = 3;

/**
 * 표시용 밴드 인덱스 — getMarchGroupIndex의 null(미집계)을 출발(0) 밴드로 보정한다.
 * balloonTotal이 0인 멤버는 getMarchGroupIndex가 이미 0을 주므로 그대로 출발 밴드.
 */
export function getMarchBandIndex(
  balloonTotal: number | null,
  milestones: MilestoneMarker[],
): number {
  return getMarchGroupIndex(balloonTotal, milestones) ?? 0;
}

/** 한 마일스톤 칸에 모인 멤버들. collapsed면 화면에서 +N 뱃지로 접는다. */
export interface MarchBand {
  index: number;
  milestone: MilestoneMarker;
  members: MarchEntry[];
  collapsed: boolean;
}

/**
 * 진군 엔트리를 마일스톤 칸(밴드)으로 그룹핑한다.
 * balloonTotal → 밴드 인덱스(미집계/0은 출발 밴드), 인원 > threshold면 collapsed.
 * 모든 마일스톤에 대해 밴드를 반환한다(빈 밴드 포함) — 컴포넌트가 칸 위치에 렌더한다.
 * 개별 마커를 트랙 전역에 흩지 않으므로 옆 칸(다음 마일스톤) 침범이 구조적으로 불가능하다.
 */
export function buildMarchBands(
  entries: MarchEntry[],
  milestones: MilestoneMarker[],
  threshold: number,
): MarchBand[] {
  return milestones.map((milestone, index) => {
    const members = entries.filter(
      (entry) => getMarchBandIndex(entry.balloonTotal, milestones) === index,
    );
    return { index, milestone, members, collapsed: members.length > threshold };
  });
}
