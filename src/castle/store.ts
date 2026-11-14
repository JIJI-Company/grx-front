// React 밖 store. 매 프레임 바뀌는 값(다른 사람 위치)은 버퍼에만 쓰고 리렌더하지 않는다.
// 리렌더(version 증가)는 입장/퇴장, 등롱 변경, 방송 각성, 연결 상태 변경 때만 일어난다.
// 등롱 연출 이벤트는 바치기 ack 성공(mine)과 lantern:count로 수가 늘어난 때(other)만 쌓인다. 입장 snapshot은 연출 없음.
import { useSyncExternalStore } from 'react';
import { InterpolationBuffer } from './interpolation';
import { isTierUp, OFFER_FX_MS, type OfferEvent, type OfferKind } from './offering';
import {
  decodePeer,
  decodeTick,
  type CastleErrorCode,
  type ConnectErrorCode,
  type FloorSnapshot,
  type LanternOfferResult,
  type MemberId,
  type PeerId,
  type PeerInfo,
  type Snapshot,
} from './protocol';
import type { ConnectionStatus, ServerMessage } from './transport';

export interface RemotePeer {
  id: PeerId;
  nickname: string;
  hornColor: string;
  buffer: InterpolationBuffer;
}

export interface AwakenEvent {
  memberId: MemberId;
  isLive: boolean;
  /** 알림 갱신 키 */
  seq: number;
}

/** 화면에 알릴 문제: 연결 거절 코드, 요청 에러 코드, 남용 종료 */
export type CastleProblem = ConnectErrorCode | CastleErrorCode | 'abuse';

export class CastleStore {
  private selfId: PeerId | null = null;
  private peerMap = new Map<PeerId, RemotePeer>();
  private lanterns = new Map<MemberId, { count: number; asOf: number }>();
  private mine = new Map<MemberId, number>();
  private live = new Set<MemberId>();
  private connection: ConnectionStatus = 'connecting';
  private problemCode: CastleProblem | null = null;
  private awaken: AwakenEvent | null = null;
  private offers: OfferEvent[] = [];
  private offerSeq = 0;
  private rejected: CastleErrorCode | null = null;
  /** join/floor:change ack 대기 중 받은 입·퇴장 (api.md §2-1) */
  private pending: { leaves: Set<PeerId>; joins: Map<PeerId, PeerInfo> } | null = null;
  private version = 0;
  private listeners = new Set<() => void>();

  // ─── 쓰기 (세션만 호출) ─────────────────────────────────────────────────────

  /** join/floor:change를 보낸 직후. 로컬 peers를 비우고 ack 전 입·퇴장을 모아 둔다 */
  beginSync(): void {
    this.pending = { leaves: new Set(), joins: new Map() };
    this.peerMap.clear();
    this.bump();
  }

  /** 입장 snapshot으로 통째로 교체 */
  applySnapshot(s: Snapshot): void {
    this.lanterns = new Map(s.lanterns.map((l) => [l.memberId, { count: l.count, asOf: s.serverTime }]));
    this.mine = new Map(s.mine.map((m) => [m.memberId, Date.parse(m.expiresAt)]));
    this.live = new Set(s.live);
    this.problemCode = null;
    this.applyPeers(s.self.id, s.peers);
  }

  applyFloorSnapshot(s: FloorSnapshot): void {
    this.applyPeers(s.self.id, s.peers);
  }

  /** 내 바치기 ack 성공. 연장(extended)이어도 바친 행동이므로 연출한다. from = 바친 위치(m) */
  applyOffer(r: LanternOfferResult, from?: { x: number; z: number }): void {
    const before = this.lanternCount(r.memberId);
    this.mine.set(r.memberId, Date.parse(r.expiresAt));
    this.setCount(r.memberId, r.count, r.asOf);
    this.pushOffer(r.memberId, 'mine', isTierUp(before, this.lanternCount(r.memberId)), from);
    this.problemCode = null;
    this.bump();
  }

  /** 서버 push 이벤트 */
  apply(msg: ServerMessage, now = performance.now()): void {
    switch (msg.type) {
      case 'peers:tick':
        for (const entry of msg.payload) {
          const peer = entry[0] === this.selfId ? undefined : this.peerMap.get(entry[0]);
          if (!peer) continue; // 나와 모르는 id는 무시
          const pose = decodeTick(entry);
          peer.buffer.push({ t: now, x: pose.x, z: pose.z, rot: pose.rotY, speed: pose.speed });
        }
        return; // 리렌더 없음
      case 'peer:join':
        if (msg.payload.id === this.selfId) return;
        this.pending?.joins.set(msg.payload.id, msg.payload);
        this.upsertPeer(msg.payload, now);
        return this.bump();
      case 'peer:leave':
        this.pending?.leaves.add(msg.payload.id);
        this.pending?.joins.delete(msg.payload.id);
        this.peerMap.delete(msg.payload.id);
        return this.bump();
      case 'lantern:count': {
        const { memberId, count, asOf } = msg.payload;
        const before = this.lanternCount(memberId);
        if (!this.setCount(memberId, count, asOf)) return;
        // 내 ack로 이미 올린 수와 같으면(내 바치기의 방송) 연출하지 않는다. 줄어든 것(만료)도 없음
        if (count > before) this.pushOffer(memberId, 'other', isTierUp(before, count));
        return this.bump();
      }
      case 'statue:awaken': {
        const { memberId, isLive } = msg.payload;
        if (this.live.has(memberId) === isLive) return; // 상태값이라 같은 값 재전송은 무시(멱등)
        if (isLive) this.live.add(memberId);
        else this.live.delete(memberId);
        this.awaken = { memberId, isLive, seq: (this.awaken?.seq ?? 0) + 1 };
        return this.bump();
      }
      case 'pos:reject': // 세션이 내 위치로 처리
      case 'session:end': // 전송 계층이 재연결을 처리
        return;
    }
  }

  setConnection(status: ConnectionStatus, code?: CastleProblem): void {
    this.connection = status;
    if (code) this.problemCode = code;
    else if (status === 'open') this.problemCode = null;
    this.bump();
  }

  /** 첫 입장이 거절됨(닉네임 금칙어·정원 초과 등) → 입장 화면으로 돌아간다 */
  rejectJoin(code: CastleErrorCode): void {
    this.rejected = code;
    this.bump();
  }

  setProblem(code: CastleProblem | null): void {
    this.problemCode = code;
    this.bump();
  }

  // ─── 읽기 ─────────────────────────────────────────────────────────────────

  get peers(): RemotePeer[] {
    return Array.from(this.peerMap.values());
  }

  /** 같은 층 인원 (나 포함) */
  get population(): number {
    return this.peerMap.size + 1;
  }

  get status(): ConnectionStatus {
    return this.connection;
  }

  get problem(): CastleProblem | null {
    return this.problemCode;
  }

  get joinRejection(): CastleErrorCode | null {
    return this.rejected;
  }

  get lastAwaken(): AwakenEvent | null {
    return this.awaken;
  }

  lanternCount(memberId: MemberId): number {
    return this.lanterns.get(memberId)?.count ?? 0;
  }

  /** 내 등롱 만료 시각(ms). 바친 적 없으면 null */
  myLanternExpiry(memberId: MemberId): number | null {
    return this.mine.get(memberId) ?? null;
  }

  /** 아직 연출 중일 수 있는 등롱 이벤트 (오래된 것은 쌓을 때 정리) */
  get offerEvents(): readonly OfferEvent[] {
    return this.offers;
  }

  isLive(memberId: MemberId): boolean {
    return this.live.has(memberId);
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getVersion = (): number => this.version;

  // ─── 내부 ─────────────────────────────────────────────────────────────────

  private applyPeers(selfId: PeerId, peers: PeerInfo[], now = performance.now()) {
    this.selfId = selfId;
    this.peerMap.clear();
    const pending = this.pending;
    peers.filter((p) => p.id !== selfId && !pending?.leaves.has(p.id)).forEach((p) => this.upsertPeer(p, now));
    pending?.joins.forEach((p) => p.id !== selfId && this.upsertPeer(p, now));
    this.pending = null;
    this.bump();
  }

  /** asOf가 더 새로울 때만 반영 (인스턴스 3개의 순서 역전 대비) */
  private setCount(memberId: MemberId, count: number, asOf: number): boolean {
    const cur = this.lanterns.get(memberId);
    if (cur && cur.asOf >= asOf) return false;
    this.lanterns.set(memberId, { count, asOf });
    return true;
  }

  private pushOffer(memberId: MemberId, kind: OfferKind, tierUp: boolean, from?: { x: number; z: number }, now = performance.now()) {
    this.offers = [...this.offers.filter((e) => now - e.start < OFFER_FX_MS), { seq: ++this.offerSeq, memberId, kind, tierUp, start: now, from }];
  }

  private upsertPeer(p: PeerInfo, now: number) {
    const pose = decodePeer(p);
    this.peerMap.set(p.id, {
      id: p.id,
      nickname: p.nickname,
      hornColor: p.hornColor,
      buffer: new InterpolationBuffer({ t: now, x: pose.x, z: pose.z, rot: pose.rotY, speed: 0 }),
    });
  }

  private bump() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }
}

const noSubscribe = () => () => {};
const noVersion = () => 0;

/** store가 바뀔 때만 리렌더 (store가 없으면 아무것도 구독하지 않는다) */
export function useCastleStore(store: CastleStore | null): number {
  return useSyncExternalStore(store?.subscribe ?? noSubscribe, store?.getVersion ?? noVersion);
}
