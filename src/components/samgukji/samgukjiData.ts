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

export type PledgeStatus = 'achieved' | 'in-progress' | 'pending';

/** 정적 입력 공약. 상태와 달성일은 저장된 별풍선 수치로 계산한다. */
export interface Pledge extends PledgeBase {
  /** 달성 기준 별풍선 개수. 아직 목표 미입력이면 null. */
  targetCount: number | null;
}

/** 현재 별풍선 스냅샷을 반영한 화면용 공약. */
export interface ResolvedPledge extends Pledge {
  status: PledgeStatus;
  /** 마지막 저장 시각 기준 ISO date. 미달성이면 null. */
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

/** 전 멤버 별풍선 합계로 판정하는 전체 누적 공약. */
export interface GlobalPledge {
  id: string;
  title: string;
  detail: string | null;
  targetCount: number;
}

export interface GlobalReward {
  id: string;
  audience: string;
  reward: string;
}

// ─── 정적 데이터 ────────────────────────────────────────────────────────────────

/**
 * 삼국지 화면에서 제외할 멤버(이름 또는 slug 기준).
 * 로스터 SSoT는 useMembers(API/mock)이고, 여기 명시된 멤버만 걸러낸다.
 */
export const SAMGUKJI_EXCLUDED = new Set<string>(['소심해', 'sosimhae']);

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

export const GLOBAL_PLEDGES: GlobalPledge[] = [
  {
    id: 'global-1m',
    title: '꾸로 OGQ 제작',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'global-2m',
    title: '꾸한성 지하철 전광판',
    detail: '전체 후원 1·2·3등 이름 넣기',
    targetCount: 2000000,
  },
];

export const GLOBAL_REWARDS: GlobalReward[] = [
  {
    id: 'global-room-top3',
    audience: '각 방 후원 1·2·3등',
    reward: '꾸한성 단체 방셀',
  },
];

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

/** 누적 공약 목록. targetCount와 저장된 멤버별 별풍선 수치를 비교해 달성 여부를 계산한다. */
export const PLEDGES: Pledge[] = [
  {
    id: 'p-gguu-100k',
    memberName: '꾸티뉴',
    title: '10개 핀볼',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-gguu-200k',
    memberName: '꾸티뉴',
    title: '설악산 올라가기',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-gguu-300k',
    memberName: '꾸티뉴',
    title: '일본에서 존나 재밌는 방송하기',
    detail: 'w신타쿠',
    targetCount: 300000,
  },
  {
    id: 'p-gguu-400k',
    memberName: '꾸티뉴',
    title: '충청에서 존나 재밌는 방송하기',
    detail: 'w한둬얼',
    targetCount: 400000,
  },
  {
    id: 'p-gguu-500k',
    memberName: '꾸티뉴',
    title: '금연',
    detail: '삼국지 끝나고 비타민 빨면서 포기할 시간 줘야 함. 실패 시 1개피당 100시간.',
    targetCount: 500000,
  },
  {
    id: 'p-gguu-600k',
    memberName: '꾸티뉴',
    title: '벌크업 ',
    detail: '최소 62kg ',
    targetCount: 600000,
  },
  {
    id: 'p-gguu-700k',
    memberName: '꾸티뉴',
    title: '아래 공약 핀볼 3개',
    detail: '[금연은 고정] 만약 80만 개 찍으면 핀볼 2개.',
    targetCount: 700000,
  },
  {
    id: 'p-gguu-800k',
    memberName: '꾸티뉴',
    title: '스트형 공약 따라 1개 같이하기',
    detail: null,
    targetCount: 800000,
  },
  {
    id: 'p-gguu-900k',
    memberName: '꾸티뉴',
    title: '자차 꾸한성 랩핑하기',
    detail: null,
    targetCount: 900000,
  },
  {
    id: 'p-gguu-1000k',
    memberName: '꾸티뉴',
    title: '지피티 스위스 따라가기',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-nanawoni-50k',
    memberName: '난워니',
    title: '난모티콘 OGQ 제작',
    detail: null,
    targetCount: 50000,
  },
  {
    id: 'p-nanawoni-100k',
    memberName: '난워니',
    title: '공포게임',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-nanawoni-150k',
    memberName: '난워니',
    title: '난키니 풀트방',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-nanawoni-200k',
    memberName: '난워니',
    title: '촉수배그 & 영도 ON',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-nanawoni-300k',
    memberName: '난워니',
    title: '나너니 미니 콘서트',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-nanawoni-500k',
    memberName: '난워니',
    title: '난머니 & 난버지 초청방',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-nanawoni-1000k',
    memberName: '난워니',
    title: '케냐 기린호텔 드가자',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-nanawoni-1500k',
    memberName: '난워니',
    title: '나너니 결혼합니다',
    detail: null,
    targetCount: 1500000,
  },
  {
    id: 'p-nanawoni-5000k',
    memberName: '난워니',
    title: '고척돔 오프라인 콘서트',
    detail: null,
    targetCount: 5000000,
  },
  {
    id: 'p-nanawoni-7000k',
    memberName: '난워니',
    title: '꾸잔과 보연동',
    detail: null,
    targetCount: 7000000,
  },
  {
    id: 'p-nanawoni-10000k',
    memberName: '난워니',
    title: '기린 분양 받아서 직접 키우기',
    detail: null,
    targetCount: 10000000,
  },
  {
    id: 'p-yamuza-100k',
    memberName: '야무지',
    title: '한 달 배달 금지 + 움직이는 무지개 이모티콘 출시',
    detail: '포장 가능.',
    targetCount: 100000,
  },
  {
    id: 'p-yamuza-150k',
    memberName: '야무지',
    title: '오리지널 뉴무지 / 가루쿡 브이로그 2탄 / 촉수 배그 치킨 노방종',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-yamuza-200k',
    memberName: '야무지',
    title: '3달 직접 요리 브이로그 + 공포게임 솔로 클리어',
    detail:
      '요리 브이로그는 2주에 1회씩 총 6회, 요리는 핀볼로 결정. 공포게임은 핀볼로 정해 솔로 클리어하며 2시간 뒤부터 무서울 때마다 친구에게 전화 가능.',
    targetCount: 200000,
  },
  {
    id: 'p-yamuza-300k',
    memberName: '야무지',
    title: '오리지널 뉴무지 모캡 방송 + 커버곡 뮤직비디오',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-yamuza-500k',
    memberName: '야무지',
    title: '롤 골드 찍기 노방종',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-yamuza-600k',
    memberName: '야무지',
    title: '엄마랑 한라산 등산하기',
    detail: '엄마가 힘들다고 하면 혼자 다녀오기.',
    targetCount: 600000,
  },
  {
    id: 'p-yamuza-700k',
    memberName: '야무지',
    title: '욕 안 쓰기 노방종',
    detail: '욕하면 하루씩 늘어납니다.',
    targetCount: 700000,
  },
  {
    id: 'p-yamuza-1000k',
    memberName: '야무지',
    title: '꾸잔 차 창문에 침 뱉고 집에 돌아오기 국토',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-enju-100k',
    memberName: '엔쥬',
    title: '종겜 핀볼 켠왕',
    detail: '공포게임 제외',
    targetCount: 100000,
  },
  {
    id: 'p-enju-200k',
    memberName: '엔쥬',
    title: '움직이는 이모티콘 OGQ 제작',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-enju-300k',
    memberName: '엔쥬',
    title: '항아리를 생각하며 도자기 구워오기',
    detail: '1종 선물',
    targetCount: 300000,
  },
  {
    id: 'p-enju-400k',
    memberName: '엔쥬',
    title: '풀트 24시간',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-enju-500k',
    memberName: '엔쥬',
    title: '공포게임 핀볼 켠왕',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-enju-600k',
    memberName: '엔쥬',
    title: '꾸잔이랑 진짜 출항하기',
    detail: null,
    targetCount: 600000,
  },
  {
    id: 'p-enju-700k',
    memberName: '엔쥬',
    title: '펠월드 서버 열기',
    detail: null,
    targetCount: 700000,
  },
  {
    id: 'p-enju-800k',
    memberName: '엔쥬',
    title: '엔쥬 오리지널 제작',
    detail: null,
    targetCount: 800000,
  },
  {
    id: 'p-enju-900k',
    memberName: '엔쥬',
    title: '메이플 풀재획 한 달 하기',
    detail: null,
    targetCount: 900000,
  },
  {
    id: 'p-enju-1000k',
    memberName: '엔쥬',
    title: '위에 거 싹 다하기!',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-okdok-50k',
    memberName: '김옥독',
    title: '노방종 200시간',
    detail: null,
    targetCount: 50000,
  },
  {
    id: 'p-okdok-100k',
    memberName: '김옥독',
    title: '난워니랑 동물 옷 입고 동물원 브이로그',
    detail: '인원 모두 달성 시',
    targetCount: 100000,
  },
  {
    id: 'p-okdok-150k',
    memberName: '김옥독',
    title: '풀트 태보 룰렛 방송',
    detail: '서라, 다뮤와 함께. 인원 모두 달성 시.',
    targetCount: 150000,
  },
  {
    id: 'p-okdok-200k',
    memberName: '김옥독',
    title: 'VR 공포게임 켠왕',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-okdok-250k',
    memberName: '김옥독',
    title: '번지점프 브이로그',
    detail: null,
    targetCount: 250000,
  },
  {
    id: 'p-okdok-300k',
    memberName: '김옥독',
    title: '꾸잔이랑 폐가 방송',
    detail: '아래 공약 다 하기',
    targetCount: 300000,
  },
  {
    id: 'p-okdok-500k',
    memberName: '김옥독',
    title: '꾸잔이랑 실제로 출항하기',
    detail: '냥쏘와 함께. 인원 모두 달성 시.',
    targetCount: 500000,
  },
  {
    id: 'p-okdok-800k',
    memberName: '김옥독',
    title: '브라질리언 왁싱 방송',
    detail: null,
    targetCount: 800000,
  },
  {
    id: 'p-okdok-1000k',
    memberName: '김옥독',
    title: '히말라야 가서 눈사람 만들고 오기',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-lika-50k',
    memberName: '리카',
    title: '풀트 태보하기',
    detail: '난워니, 바먀와 함께',
    targetCount: 50000,
  },
  {
    id: 'p-lika-100k',
    memberName: '리카',
    title: '버츄얼 오리지널 리카 공개',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-lika-200k',
    memberName: '리카',
    title: '일러스트 커버곡 제작',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-lika-300k',
    memberName: '리카',
    title: '애기리카 제작, 풀트 장비 업그레이드',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-lika-400k',
    memberName: '리카',
    title: '오리지널 헤어, 오리지널 의상 제작',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-lika-500k',
    memberName: '리카',
    title: '란다랑 모션캡처 합방',
    detail: '둘 다 달성 시',
    targetCount: 500000,
  },
  {
    id: 'p-lika-600k',
    memberName: '리카',
    title: '부모님께 안마의자 선물',
    detail: null,
    targetCount: 600000,
  },
  {
    id: 'p-lika-700k',
    memberName: '리카',
    title: '모션캡처 슈트 구매 후 모캡 방송',
    detail: null,
    targetCount: 700000,
  },
  {
    id: 'p-lika-800k',
    memberName: '리카',
    title: '리카 댄스 퍼포먼스 비디오 찍기',
    detail: null,
    targetCount: 800000,
  },
  {
    id: 'p-lika-900k',
    memberName: '리카',
    title: '리카 버츄얼 온라인 콘서트',
    detail: null,
    targetCount: 900000,
  },
  {
    id: 'p-lika-1000k',
    memberName: '리카',
    title: '오리지널곡 시네마틱 뮤직비디오 제작',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-damu-50k',
    memberName: '다뮤',
    title: '뮤림단 OGQ 출시',
    detail: null,
    targetCount: 50000,
  },
  {
    id: 'p-damu-70k',
    memberName: '다뮤',
    title: '사슬게임 2000m 노방종',
    detail: '서라, 타미, 워니와 함께',
    targetCount: 70000,
  },
  {
    id: 'p-damu-100k',
    memberName: '다뮤',
    title: '협동 똥겜',
    detail: '야무지와 함께',
    targetCount: 100000,
  },
  {
    id: 'p-damu-150k',
    memberName: '다뮤',
    title: '태보',
    detail: '옥독, 서라, 다뮤와 함께',
    targetCount: 150000,
  },
  {
    id: 'p-damu-200k',
    memberName: '다뮤',
    title: '다진다 돈까스 먹방',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-damu-300k',
    memberName: '다뮤',
    title: 'VR 공포게임',
    detail: '야무지와 함께. 혼자 달성 시 좀 더 덜 무서운 게임으로.',
    targetCount: 300000,
  },
  {
    id: 'p-damu-400k',
    memberName: '다뮤',
    title: '제주도 다뮤 왔다감 포스트잇 인증',
    detail: '사진 찍고 돌아오기. 비행기 시간 인증, 놀기 금지.',
    targetCount: 400000,
  },
  {
    id: 'p-damu-500k',
    memberName: '다뮤',
    title: '패러글라이딩 동영상 인증',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-mint-100k',
    memberName: '임민트',
    title: '팬 캐릭터 OGQ 만들기',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-mint-150k',
    memberName: '임민트',
    title: '민트, 모야, 무지 합동 공겜',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-mint-200k',
    memberName: '임민트',
    title: '노방종 시간 룰렛 오픈',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-mint-250k',
    memberName: '임민트',
    title: '촉각슈트 공포게임',
    detail: null,
    targetCount: 250000,
  },
  {
    id: 'p-mint-300k',
    memberName: '임민트',
    title: '아바타 전신성형 + 한라산 정상 등반',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-mint-500k',
    memberName: '임민트',
    title: '집에서부터 걸어서 NC 직관 가기',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-mint-1000k',
    memberName: '임민트',
    title: '장가계 꾸잔 코스',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-randa-100k',
    memberName: '란다',
    title: '풀트 태보 방송 + 룰렛',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-randa-150k',
    memberName: '란다',
    title: '팬캐릭터 제작 및 움직이는 OGQ 만들기',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-randa-200k',
    memberName: '란다',
    title: '개인 커버곡 제작',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-randa-250k',
    memberName: '란다',
    title: '모야랑 뮤직비디오 제작',
    detail: null,
    targetCount: 250000,
  },
  {
    id: 'p-randa-300k',
    memberName: '란다',
    title: '오리지널 의상 제작',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-randa-400k',
    memberName: '란다',
    title: '촉각슈트 구매 후 정기 콘텐츠화',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-randa-500k',
    memberName: '란다',
    title: '리카랑 모션캡처 합방',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-moya-100k',
    memberName: '모야',
    title: '풀트 태보 룰렛 + 움직이는 OGQ 제작',
    detail: '태보는 모야, 란다, 냥쏘 포함 셋 다 달성 시. OGQ는 목표 달성 시.',
    targetCount: 100000,
  },
  {
    id: 'p-moya-150k',
    memberName: '모야',
    title: '4인 공겜',
    detail: '임민트, 야무지, 서라0와 함께. 넷 다 달성 시.',
    targetCount: 150000,
  },
  {
    id: 'p-moya-200k',
    memberName: '모야',
    title: '꾸잔이랑 듀엣 커버곡',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-moya-250k',
    memberName: '모야',
    title: '뮤비 커버곡 제작',
    detail: '란다와 함께',
    targetCount: 250000,
  },
  {
    id: 'p-moya-300k',
    memberName: '모야',
    title: '일본 브이로그',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-moya-400k',
    memberName: '모야',
    title: '번지점프 브이로그',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-moya-500k',
    memberName: '모야',
    title: '한라산 등산',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-moya-1000k',
    memberName: '모야',
    title: '모야 단독 콘서트',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-baamya-50k',
    memberName: '바먀',
    title: '난워니, 리카, 바먀 태보 풀트',
    detail: null,
    targetCount: 50000,
  },
  {
    id: 'p-baamya-100k',
    memberName: '바먀',
    title: '움직이는 밤비티콘',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-baamya-200k',
    memberName: '바먀',
    title: '가을에 산 가서 밤 줍기 + 인증 영상',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-baamya-300k',
    memberName: '바먀',
    title: '바먀 오리지널 곡',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-baamya-400k',
    memberName: '바먀',
    title: '홍대 가서 번호 딸 때까지 노숙',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-baamya-500k',
    memberName: '바먀',
    title: '일본 가서 번호 딸 때까지 체류',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-baamya-600k',
    memberName: '바먀',
    title: '시청자 식사 데이트 핀볼',
    detail: null,
    targetCount: 600000,
  },
  {
    id: 'p-baamya-700k',
    memberName: '바먀',
    title: '시골 가서 두더지 잡아 와서 키우기',
    detail: null,
    targetCount: 700000,
  },
  {
    id: 'p-baamya-800k',
    memberName: '바먀',
    title: '관제탑 추면서 지리산 등산하기',
    detail: null,
    targetCount: 800000,
  },
  {
    id: 'p-baamya-900k',
    memberName: '바먀',
    title: '세렝게티 한 마리의 외로운 고양이 되기',
    detail: null,
    targetCount: 900000,
  },
  {
    id: 'p-baamya-1000k',
    memberName: '바먀',
    title: '유니콘 잡아 올게 걍',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-yuntami-50k',
    memberName: '윤타미',
    title: '움직이는 탐냥티콘',
    detail: 'OGQ',
    targetCount: 50000,
  },
  {
    id: 'p-yuntami-70k',
    memberName: '윤타미',
    title: '사슬게임 2000m 켠왕',
    detail: '다뮤, 서라, 워니, 타미와 함께',
    targetCount: 70000,
  },
  {
    id: 'p-yuntami-100k',
    memberName: '윤타미',
    title: '공겜 핀볼',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-yuntami-150k',
    memberName: '윤타미',
    title: '커버곡 제작',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-yuntami-200k',
    memberName: '윤타미',
    title: 'NEW 버츄얼',
    detail: null,
    targetCount: 200000,
  },
  {
    id: 'p-yuntami-300k',
    memberName: '윤타미',
    title: '풀트 구매 + 리카한테 춤 배우기',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-yuntami-400k',
    memberName: '윤타미',
    title: '제주도 낚시 체험으로 물고기 잡고 인증하기',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-yuntami-500k',
    memberName: '윤타미',
    title: '도쿄 디즈니랜드 가서 코스프레한 사람과 같이 사진 찍기',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-seora0-70k',
    memberName: '서라0',
    title: '사슬게임 2000m 가기',
    detail: '다뮤, 타미와 함께',
    targetCount: 70000,
  },
  {
    id: 'p-seora0-100k',
    memberName: '서라0',
    title: '풀트 시그춤 룰렛',
    detail: null,
    targetCount: 100000,
  },
  {
    id: 'p-seora0-120k',
    memberName: '서라0',
    title: '4인 공겜',
    detail: '모야, 민트, 무지와 함께',
    targetCount: 120000,
  },
  {
    id: 'p-seora0-150k',
    memberName: '서라0',
    title: '풀트 태보 룰렛',
    detail: '옥독, 다뮤와 함께',
    targetCount: 150000,
  },
  {
    id: 'p-seora0-200k',
    memberName: '서라0',
    title: '춤배틀',
    detail: '워니, 무지와 함께',
    targetCount: 200000,
  },
  {
    id: 'p-seora0-250k',
    memberName: '서라0',
    title: '촉각슈트 플레이',
    detail: null,
    targetCount: 250000,
  },
  {
    id: 'p-nyangsso-50k',
    memberName: '냥쏘',
    title: '촉각슈트 프로',
    detail: '종일',
    targetCount: 50000,
  },
  {
    id: 'p-nyangsso-100k',
    memberName: '냥쏘',
    title: '풀트 구매 후 시그댄스 DAY + 태보 룰렛',
    detail: '태보 룰렛은 모야, 란다와 함께',
    targetCount: 100000,
  },
  {
    id: 'p-nyangsso-150k',
    memberName: '냥쏘',
    title: '커버곡 내기',
    detail: null,
    targetCount: 150000,
  },
  {
    id: 'p-nyangsso-200k',
    memberName: '냥쏘',
    title: '공겜 이운도 + 24시간 노방종',
    detail: '공겜 이운도 12시간',
    targetCount: 200000,
  },
  {
    id: 'p-nyangsso-300k',
    memberName: '냥쏘',
    title: '꾸잔 차 세차해주기 방송',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-nyangsso-400k',
    memberName: '냥쏘',
    title: '현실 메차리멜레온',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-nyangsso-500k',
    memberName: '냥쏘',
    title: '꾸잔이랑 진짜 실제 출항',
    detail: '옥독과 함께',
    targetCount: 500000,
  },
  {
    id: 'p-nyangsso-1000k',
    memberName: '냥쏘',
    title: '후원 1등이랑 결혼',
    detail: null,
    targetCount: 1000000,
  },
  {
    id: 'p-ttanttan-100k',
    memberName: '딴딴2당',
    title: '1인 공겜',
    detail: '청자가 골라주는 게임',
    targetCount: 100000,
  },
  {
    id: 'p-ttanttan-200k',
    memberName: '딴딴2당',
    title: '오리지널 또는 퀄업',
    detail: '개인 팬들과 합의해서 결정',
    targetCount: 200000,
  },
  {
    id: 'p-ttanttan-300k',
    memberName: '딴딴2당',
    title: '한 달 노방종',
    detail: null,
    targetCount: 300000,
  },
  {
    id: 'p-ttanttan-400k',
    memberName: '딴딴2당',
    title: '규태 오빠랑 대나무숲 탈출 브이로그',
    detail: null,
    targetCount: 400000,
  },
  {
    id: 'p-ttanttan-500k',
    memberName: '딴딴2당',
    title: '김모야 피부 관리 ASMR 브이로그',
    detail: null,
    targetCount: 500000,
  },
  {
    id: 'p-ttanttan-600k',
    memberName: '딴딴2당',
    title: '꾸잔 만나서 버보라',
    detail: null,
    targetCount: 600000,
  },
  {
    id: 'p-ttanttan-700k',
    memberName: '딴딴2당',
    title: '반캠 또는 쿡방',
    detail: '달성 시 바로 진행',
    targetCount: 700000,
  },
  {
    id: 'p-ttanttan-1000k',
    memberName: '딴딴2당',
    title: '꾸잔이랑 장가계',
    detail: '뒤얼과 함께',
    targetCount: 1000000,
  },
];

/**
 * 멤버별 공약 게시물 URL(override 맵). 그리드 노출 대상은 로스터 전체(소심해 제외)이며,
 * 이 맵에 없는 멤버는 '#'(placeholder)로 폴백한다. 아직 실제 게시물이 없어 전부 '#'.
 * 사용자가 실제 게시물 URL(외부 링크 가능)로 교체한다. key는 Member.stageName과 일치.
 */
export const PLEDGE_POST_URLS: Record<string, string> = {
  꾸티뉴: '#',
  야무지: 'https://www.sooplive.com/station/land4968/post/202380759',
  엔쥬: 'https://www.sooplive.com/station/northpole/post/202380199',
  리카: 'https://www.sooplive.com/station/lika07/post/202369057',
  난워니: '#',
  다뮤: 'https://www.sooplive.com/station/not15987/post/202376561',
  딴딴2당: 'https://www.sooplive.com/station/dbsk0708/post/202380587',
  바먀: '#',
  서라0: '#',
  임민트: 'https://www.sooplive.com/station/mint616/post/202374159',
  김옥독: 'https://www.sooplive.com/station/niniru/post/202367397',
  냥쏘: 'https://www.sooplive.com/station/leesoi34/post/202375345',
  윤타미: '#',
  모야: 'https://www.sooplive.com/station/neul0908/post/202371523',
  란다: '#',
};
