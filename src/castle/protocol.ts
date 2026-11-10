// 무한성 WebSocket 계약 v1. grx-back docs/design/castle-courtyard-20261110/api.md 가 원본.
// 단위: 좌표 cm 정수, 회전 rad×100 정수, 속도 cm/s 정수, 시각 ISO 문자열 또는 epoch ms(필드별 명시).

export const CASTLE_PROTOCOL_VERSION = 1 as const;
export const CASTLE_NAMESPACE = '/castle';

export type FloorId = 'B1' | 'B2' | 'B3';
/** 연결마다 서버가 새로 주는 숫자. 재접속하면 바뀐다. */
export type PeerId = number;
/** member.member_id (uuid) */
export type MemberId = string;

// ── 튜플 ────────────────────────────────────────────────
/** 클라이언트 → 서버 위치. [x cm, z cm, rotY rad×100, speed cm/s] 모두 정수 */
export type PosTuple = [x: number, z: number, rotY: number, speed: number];
/** 서버 → 클라이언트 틱 항목. [peerId, x cm, z cm, rotY rad×100, speed cm/s] */
export type TickEntry = [id: PeerId, x: number, z: number, rotY: number, speed: number];

// ── 핸드셰이크 ──────────────────────────────────────────
export interface CastleHandshakeAuth {
  /** 32바이트 무작위 → base64url(패딩 없음) 43자. localStorage 'castle.guestToken' */
  token: string;
  protocol: typeof CASTLE_PROTOCOL_VERSION;
}

export type ConnectErrorCode =
  | 'bad_token'          // 토큰 형식 오류 — 재시도 무의미, 토큰 재생성
  | 'protocol_mismatch'  // 클라이언트가 구버전 — 새로고침 안내
  | 'origin_denied'      // 허용되지 않은 사이트 — 재시도 무의미
  | 'rate_limited'       // IP당 연결 과다 — 백오프 후 재시도
  | 'guest_limit'        // 이 IP에서 새 게스트가 너무 많음(24h) — 기존 토큰이면 통과
  | 'unavailable';       // Redis 등 일시 장애 — 백오프 후 재시도

/** socket.on('connect_error', (err) => (err as any).data as ConnectErrorData) */
export interface ConnectErrorData {
  code: ConnectErrorCode;
  retryAfterMs?: number;
}

// ── 공통 응답 봉투 ──────────────────────────────────────
export type CastleErrorCode =
  | 'bad_request'        // 페이로드 검증 실패
  | 'not_joined'         // join 전에 보낸 요청
  | 'already_joined'     // 같은 소켓으로 join 두 번
  | 'hall_not_found'     // 없는 성 또는 닫힌 성
  | 'hall_full'          // 정원(층 합계) 초과
  | 'statue_not_found'   // 석상이 없는 멤버
  | 'statue_wrong_floor' // 다른 층 석상
  | 'rate_limited'       // 너무 잦음 (retryAfterMs 참고)
  | 'unavailable'        // 일시 장애
  | 'internal';

export interface CastleError {
  code: CastleErrorCode;
  message?: string;      // 디버그용 영어 문장. 화면 문구는 프론트가 code로 결정
  retryAfterMs?: number;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: CastleError };

// ── 엔티티 ──────────────────────────────────────────────
export interface PeerInfo {
  id: PeerId;
  nickname: string;      // 1~12자
  hornColor: string;     // '#rrggbb' 소문자
  x: number;             // cm
  z: number;             // cm
  rotY: number;          // rad×100
}

export interface SelfState {
  id: PeerId;
  floor: FloorId;
  x: number;             // cm, 서버가 정한 시작 위치 (스폰 또는 클램프된 at)
  z: number;
}

export interface LanternCount {
  memberId: MemberId;
  count: number;         // 만료 전 등롱 수 (모든 성 합산)
}

export interface MyLantern {
  memberId: MemberId;
  expiresAt: string;     // ISO 8601
}

// ── 요청 / 응답 ─────────────────────────────────────────
export interface JoinRequest {
  hall: string;          // castle_hall.slug
  floor: FloorId;
  nickname: string;      // trim 후 1~12자, 제어문자 금지
  hornColor: string;     // /^#[0-9a-fA-F]{6}$/
  /** 재접속 복귀용 이전 위치 [x cm, z cm]. 없으면 그 층 스폰. 서버가 층 경계로 클램프 */
  at?: [x: number, z: number];
}

export interface Snapshot {
  self: SelfState;
  hall: { slug: string; name: string; capacity: number };
  peers: PeerInfo[];             // 같은 성·같은 층, 나 제외
  lanterns: LanternCount[];      // 석상 전체 (count 0인 석상은 생략될 수 있음 → 0으로 간주)
  mine: MyLantern[];             // 내가 바친 유효 등롱
  live: MemberId[];              // 지금 방송 중인 석상 멤버
  serverTime: number;            // epoch ms. lanterns의 asOf로 사용
}

export interface FloorChangeRequest {
  floor: FloorId;
}

export interface FloorSnapshot {
  self: SelfState;               // 새 층 스폰 위치
  peers: PeerInfo[];
}

export interface LanternOfferRequest {
  memberId: MemberId;
}

export interface LanternOfferResult {
  memberId: MemberId;
  expiresAt: string;             // ISO, 지금 + 7일
  extended: boolean;             // true = 이미 있던 등롱을 연장
  count: number;                 // 바친 직후 그 석상의 유효 등롱 수
  asOf: number;                  // epoch ms
}

// ── 서버 → 클라이언트 push ──────────────────────────────
export interface PeerLeave { id: PeerId }
export interface PosReject { x: number; z: number }          // cm. 이 위치로 되돌려라
export interface LanternCountEvent extends LanternCount { asOf: number }
export interface StatueAwaken {
  memberId: MemberId;
  memberSlug: string;
  isLive: boolean;               // 상태값(토글 아님) — 여러 번 받아도 멱등
}
export type SessionEndReason = 'server_restart' | 'abuse' | 'hall_closed';
export interface SessionEnd {
  reason: SessionEndReason;
  retryAfterMs?: number;         // 이만큼 기다렸다 재연결. abuse면 재연결하지 않음
}

// ── socket.io 타입 맵 ───────────────────────────────────
export interface ServerToClientEvents {
  'peers:tick': (entries: TickEntry[]) => void;   // 100ms, 인스턴스별 묶음 (최대 3개/틱)
  'peer:join': (peer: PeerInfo) => void;          // 같은 룸
  'peer:leave': (msg: PeerLeave) => void;         // 같은 룸
  'pos:reject': (msg: PosReject) => void;         // 본인에게만
  'lantern:count': (msg: LanternCountEvent) => void; // 네임스페이스 전체
  'statue:awaken': (msg: StatueAwaken) => void;   // 네임스페이스 전체
  'session:end': (msg: SessionEnd) => void;       // 본인에게만, 직후 서버가 끊음
}

export interface ClientToServerEvents {
  join: (req: JoinRequest, ack: (res: Ack<Snapshot>) => void) => void;
  'floor:change': (req: FloorChangeRequest, ack: (res: Ack<FloorSnapshot>) => void) => void;
  pos: (p: PosTuple) => void;                     // ack 없음, 10Hz
  'lantern:offer': (req: LanternOfferRequest, ack: (res: Ack<LanternOfferResult>) => void) => void;
  // 예약 (MVP 제외, 서버 미구현): emote
}

// import type { Socket } from 'socket.io-client';
// export type CastleSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ── 공유 상수 (서버와 같은 값이어야 함) ─────────────────
export const CASTLE_LIMITS = {
  posPerSecond: 15,          // 서버 상한. 클라이언트는 10Hz로 보낸다
  runSpeedMps: 7.5,          // 서버 속도 검증 기준. 클라이언트 달리기 속도가 이보다 크면 안 됨
  nicknameMax: 12,
  hallCapacityDefault: 100,
  lanternDays: 7,
} as const;

/** 등롱 수 → 밝기 단계 (MVP 확정: 0 / 1~4 / 5~19 / 20~49 / 50+) */
export function lanternTier(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count >= 50) return 4;
  if (count >= 20) return 3;
  if (count >= 5) return 2;
  if (count >= 1) return 1;
  return 0;
}

// ── REST (프론트 관례상 src/api/types.ts 에 둬도 됨) ─────
/** GET /api/castle/halls */
export interface CastleHallSummary {
  slug: string;
  name: string;
  capacity: number;
  total: number;                          // 층 합계 현재 인원
  floors: Record<FloorId, number>;        // 층별 현재 인원
  isFull: boolean;                        // total >= capacity
}

/** GET /api/castle/statues */
export interface CastleStatueFloor {
  floor: FloorId;
  rankSlug: 'lower-rank' | 'upper-rank' | 'master' | 'new'; // 'new': 2026-11-10 승인(Q-D1) 반영, api.md 본문 갱신 대기
  rankName: string;                       // member_rank.name (하현 / 상현 / The Master)
  statues: CastleStatue[];                // order 오름차순
}

export interface CastleStatue {
  memberId: MemberId;
  slug: string;                           // member.slug
  stageName: string;
  personalColor: string | null;           // 석상·등롱 색. null이면 프론트 기본색
  order: number;                          // 층 안에서 0부터. 프론트 floors.ts가 자리(좌표)로 변환
  modelUrl: string | null;                // MVP는 항상 null (PoC 도형). 에셋 교체 후 R2 URL
  isLive: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// 프론트 전용 (api.md 밖): 단위 변환. 미터·라디안 ↔ 전송 정수 변환은 이 함수들만 한다.
// ════════════════════════════════════════════════════════════════════════════

const toWire = (v: number) => Math.round(v * 100);
const fromWire = (v: number) => v / 100;

export function encodePos(x: number, z: number, rotY: number, speed: number): PosTuple {
  return [toWire(x), toWire(z), toWire(rotY), toWire(speed)];
}

export interface Pose {
  x: number;
  z: number;
  rotY: number;
  speed: number;
}

export function decodeTick([, x, z, rotY, speed]: TickEntry): Pose {
  return { x: fromWire(x), z: fromWire(z), rotY: fromWire(rotY), speed: fromWire(speed) };
}

export function decodePeer(p: Pick<PeerInfo, 'x' | 'z' | 'rotY'>): Pose {
  return { x: fromWire(p.x), z: fromWire(p.z), rotY: fromWire(p.rotY), speed: 0 };
}

/** cm 좌표 → m */
export function decodePoint(p: { x: number; z: number }): { x: number; z: number } {
  return { x: fromWire(p.x), z: fromWire(p.z) };
}

/** m 좌표 → join.at */
export function encodeAt(x: number, z: number): [number, number] {
  return [toWire(x), toWire(z)];
}
