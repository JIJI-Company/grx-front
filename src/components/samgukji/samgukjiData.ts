// 삼국지(三國志) 공약 — 프론트 로컬 정적 데이터.
// 백엔드 API에 공약(pledge) 계약이 아직 없으므로, 화면 축과 분리된 도메인 데이터를
// 여기서 interface + 정적 값으로 정의한다. 멤버 연결은 Member.stageName을 키로 재사용한다.
// (backend 계약을 임의로 만들지 않는다 — 여기 타입은 프론트 로컬 전용이다.)

// ─── Abstraction: 공약 도메인 타입 ──────────────────────────────────────────────

/** 상속(interface extends)의 base — 모든 공약 레코드가 공유하는 최소 필드. */
export interface PledgeBase {
  id: string;
  title: string;
  detail: string | null;
  /** 기존 Member.stageName과 연결되는 키. */
  memberName: string;
}

/** 다형성의 판별 필드(discriminated union의 tag). */
export type PledgeKind = 'personal' | 'cumulative' | 'special';
export type PledgeStatus = 'achieved' | 'in-progress' | 'pending';

/** PledgeBase를 확장(상속)해 공약 종류·상태를 얹는다. */
export interface Pledge extends PledgeBase {
  kind: PledgeKind;
  status: PledgeStatus;
  /** ISO date. 미달성이면 null. */
  achievedAt: string | null;
}

/** 진군(행군) 트랙의 마일스톤 정거장. */
export interface MilestoneMarker {
  value: number;
  label: string;
}

/** 진군 배경 이미지 속 불빛 거점 좌표(%). 마일스톤과 1:1로 대응한다. */
export interface MarchPathPoint {
  x: number;
  y: number;
}

/** 누적 도전미션 카드. value가 null이면 실데이터 대기(대기중) 상태. */
export interface CampaignStat {
  key: string;
  label: string;
  value: number | null;
  suffix: string;
}

// ─── 정적 데이터 ────────────────────────────────────────────────────────────────

/**
 * 삼국지 화면에서 제외할 멤버(이름 또는 slug 기준).
 * 로스터 SSoT는 useMembers(API/mock)이고, 여기 명시된 멤버만 걸러낸다.
 */
export const SAMGUKJI_EXCLUDED = new Set<string>(['소심해', 'sosimhae', '봄세이', 'bomsai']);

/**
 * 누적 API 현황 — 중앙 단일 카드. value는 전 멤버 '진행 중 도전미션 모금 별풍선'의 총합(실데이터).
 * 로딩 전/전원 조회 실패 시 대기중(value: null).
 */
export const CUMULATIVE_STAT: CampaignStat = {
  key: 'api',
  label: '누적 API',
  value: null,
  suffix: '',
};

/** 진군 마일스톤 — 출발점부터 별풍선 100만까지. */
export const MILESTONES: MilestoneMarker[] = [
  { value: 0, label: '출발' },
  { value: 50000, label: '5만' },
  { value: 100000, label: '10만' },
  { value: 200000, label: '20만' },
  { value: 300000, label: '30만' },
  { value: 500000, label: '50만' },
  { value: 1000000, label: '100만' },
];

// 배경(march-track-bg.webp, 2172×724)을 stretch(100% 100%)로 깔므로
// 각 점은 배경 이미지 속 봉화탑 중심의 x·y 백분율과 동일하다(실측). 좌표계 inset=0.
export const MARCH_PATH_POINTS: MarchPathPoint[] = [
  { x: 5.8, y: 78 },
  { x: 18.1, y: 80.5 },
  { x: 33.2, y: 85.5 },
  { x: 55.5, y: 81 },
  { x: 68.3, y: 78 },
  { x: 80.1, y: 81 },
  { x: 91.6, y: 78.5 },
];

/**
 * 멤버별 '말 탄 장수' 아이콘 경로(override). 있으면 트랙 마커가 <img>, 없으면 notice 아바타→프로필→이니셜 폴백.
 * 진군 수치(current)는 실데이터(별풍선 합계)로 주입되고, 이 맵은 아이콘 슬롯만 담당한다.
 * 파일 컨벤션: public/img/samgukji/<member-slug>.png → '꾸티뉴': '/img/samgukji/gguu.png'
 * (사용자가 아이콘을 추가하면서 채운다. key는 Member.stageName과 일치.)
 */
export const MARCH_ICON_SRC: Record<string, string> = {};

/** 공약 목록 — 개인/누적/특별 3종. status로 달성 여부 구분. */
export const PLEDGES: Pledge[] = [
  {
    id: 'p-gguu-1',
    kind: 'personal',
    memberName: '꾸티뉴',
    title: '천하통일 릴레이 방송',
    detail: '50만 도달 시 24시간 무한성 총력 릴레이 방송 진행.',
    status: 'in-progress',
    achievedAt: null,
  },
  {
    id: 'p-gguu-2',
    kind: 'special',
    memberName: '꾸티뉴',
    title: '전 장수 합동 야외 촬영',
    detail: '누적 공약 10건 달성 시 전원 갑주 컨셉 화보.',
    status: 'pending',
    achievedAt: null,
  },
  {
    id: 'p-yamuza-1',
    kind: 'personal',
    memberName: '야무지',
    title: '달의 호흡 완주 챌린지',
    detail: '30만 돌파 기념 리듬게임 풀콤 도전 생방송.',
    status: 'achieved',
    achievedAt: '2026-06-18',
  },
  {
    id: 'p-yamuza-2',
    kind: 'cumulative',
    memberName: '야무지',
    title: '수면 참기 24시간',
    detail: '누적 시청 시간 목표 달성 시 무박 방송.',
    status: 'in-progress',
    achievedAt: null,
  },
  {
    id: 'p-enju-1',
    kind: 'personal',
    memberName: '엔쥬',
    title: '연유라떼 베이킹 방송',
    detail: '10만 도달 시 직접 만든 디저트 나눔.',
    status: 'achieved',
    achievedAt: '2026-05-30',
  },
  {
    id: 'p-enju-2',
    kind: 'special',
    memberName: '엔쥬',
    title: '북극여우 성대모사 모음',
    detail: '특별 공약 — 요청 폭주 시 공개.',
    status: 'pending',
    achievedAt: null,
  },
  {
    id: 'p-lika-1',
    kind: 'personal',
    memberName: '리카',
    title: '항아리 게임 정상 등정',
    detail: '9만 돌파 시 항아리 게임 엔딩까지 무편집 생방송.',
    status: 'in-progress',
    achievedAt: null,
  },
  {
    id: 'p-lika-2',
    kind: 'cumulative',
    memberName: '리카',
    title: '크앙단 팬미팅',
    detail: '누적 후원 목표 달성 시 오프라인 소규모 팬미팅.',
    status: 'pending',
    achievedAt: null,
  },
  {
    id: 'p-nyangsso-1',
    kind: 'personal',
    memberName: '냥쏘',
    title: '해산물 먹방 대첩',
    detail: '5만 도달 기념 대게 먹방.',
    status: 'achieved',
    achievedAt: '2026-06-02',
  },
  {
    id: 'p-damu-1',
    kind: 'cumulative',
    memberName: '다뮤',
    title: '워터밤 재현 방송',
    detail: '누적 목표 도달 시 여름 특집.',
    status: 'in-progress',
    achievedAt: null,
  },
  {
    id: 'p-mint-1',
    kind: 'special',
    memberName: '임민트',
    title: '실측 키 공개 방송',
    detail: '특별 공약 — 2m 진위 여부 공개 검증.',
    status: 'pending',
    achievedAt: null,
  },
];

/**
 * 멤버별 공약 게시물 URL(override 맵). 그리드 노출 대상은 로스터 전체(소심해 제외)이며,
 * 이 맵에 없는 멤버는 '#'(placeholder)로 폴백한다. 아직 실제 게시물이 없어 전부 '#'.
 * 사용자가 실제 게시물 URL(외부 링크 가능)로 교체한다. key는 Member.stageName과 일치.
 */
export const PLEDGE_POST_URLS: Record<string, string> = {
  꾸티뉴: '#',
  야무지: '#',
  엔쥬: '#',
  리카: '#',
  냥쏘: '#',
  다뮤: '#',
  임민트: '#',
};
