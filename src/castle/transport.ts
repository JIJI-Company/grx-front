// 전송 계층 추상화. 세션·스토어는 이 인터페이스에만 의존하고, 실제(socket.io)인지 mock인지 모른다.
// 요청-응답(ack)과 push 이벤트의 타입은 protocol.ts의 socket.io 타입 맵에서 파생한다 → 계약이 바뀌면 자동으로 따라온다.
import type { Ack, ClientToServerEvents, ConnectErrorCode, PosTuple, ServerToClientEvents } from './protocol';
import { MockTransport } from './mockTransport';
import { SocketTransport } from './socketTransport';

/** ack가 있는 요청 이름 (pos 제외) */
export type RequestName = Exclude<keyof ClientToServerEvents, 'pos'>;
export type RequestOf<K extends RequestName> = Parameters<ClientToServerEvents[K]>[0];
export type ResultOf<K extends RequestName> = Parameters<Parameters<ClientToServerEvents[K]>[1]>[0] extends Ack<infer T> ? T : never;

/** 서버 push 이벤트 discriminated union — 소비자는 `switch (msg.type)`로 좁힌다 */
export type ServerMessage = {
  [K in keyof ServerToClientEvents]: { type: K; payload: Parameters<ServerToClientEvents[K]>[0] };
}[keyof ServerToClientEvents];

/**
 * open: 연결됨 (최초·재연결 모두) → 세션이 join을 보낸다
 * failed: 재시도해도 소용없는 거절(bad_token·protocol_mismatch·origin_denied) 또는 abuse 종료
 */
export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'failed';

export interface TransportHandlers {
  onMessage: (msg: ServerMessage) => void;
  onStatus: (status: ConnectionStatus, code?: ConnectErrorCode | 'abuse') => void;
}

export interface CastleTransport {
  connect(handlers: TransportHandlers): void;
  request<K extends RequestName>(name: K, req: RequestOf<K>): Promise<Ack<ResultOf<K>>>;
  /** 10Hz 위치. 연결이 없으면 버린다 */
  sendPos(pos: PosTuple): void;
  /** 끊고 다시 연결 (ack 실패 시 상태 복구용) */
  reconnect(): void;
  disconnect(): void;
}

export const USE_CASTLE_MOCK = import.meta.env.VITE_MOCK === 'true';

export function createTransport(): CastleTransport {
  return USE_CASTLE_MOCK ? new MockTransport() : new SocketTransport();
}
