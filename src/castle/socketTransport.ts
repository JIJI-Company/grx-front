// socket.io 실제 구현 (api.md §2 연결 규약).
import { io, type Socket } from 'socket.io-client';
import { getGuestToken } from './guestToken';
import {
  CASTLE_NAMESPACE,
  CASTLE_PROTOCOL_VERSION,
  type Ack,
  type ClientToServerEvents,
  type ConnectErrorCode,
  type ConnectErrorData,
  type PosTuple,
  type ServerToClientEvents,
} from './protocol';
import type { CastleTransport, RequestName, RequestOf, ResultOf, ServerMessage, TransportHandlers } from './transport';

type CastleSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const ACK_TIMEOUT_MS = 5000;
const FATAL: ReadonlySet<ConnectErrorCode> = new Set(['bad_token', 'protocol_mismatch', 'origin_denied']);
/** 빠뜨리면 컴파일 에러 — 서버 push 이벤트가 늘면 여기도 늘린다 */
const PUSH_EVENTS: Record<keyof ServerToClientEvents, true> = {
  'peers:tick': true,
  'peer:join': true,
  'peer:leave': true,
  'pos:reject': true,
  'lantern:count': true,
  'statue:awaken': true,
  'session:end': true,
};

// VITE_CASTLE_WS_ORIGIN > VITE_API_BASE_URL의 origin > 현재 origin(dev는 vite 프록시)
function apiOrigin(): string {
  const explicit = import.meta.env.VITE_CASTLE_WS_ORIGIN as string | undefined;
  if (explicit) return explicit.replace(/\/+$/, '');
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return apiBase ? new URL(apiBase, window.location.origin).origin : window.location.origin;
}

const jitter = (min: number, max: number) => min + Math.random() * (max - min);

export class SocketTransport implements CastleTransport {
  private socket: CastleSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  /** 재시도 무의미한 거절을 받으면 더 연결하지 않는다 */
  private halted = false;

  connect({ onMessage, onStatus }: TransportHandlers): void {
    onStatus('connecting');
    const socket: CastleSocket = io(`${apiOrigin()}${CASTLE_NAMESPACE}`, {
      transports: ['websocket'],
      // 함수로 주면 재연결 때마다 다시 읽는다
      auth: (cb) => cb({ token: getGuestToken(), protocol: CASTLE_PROTOCOL_VERSION }),
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
    });
    this.socket = socket;

    socket.on('connect', () => onStatus('open'));
    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect' || this.halted) return;
      onStatus('reconnecting');
      // 서버가 끊은 연결은 자동 재연결되지 않는다 (session:end가 먼저 왔으면 그 타이머를 따른다)
      if (reason === 'io server disconnect' && !this.retryTimer) this.retryLater(jitter(1000, 5000));
    });
    socket.on('connect_error', (err) => {
      const data = (err as Error & { data?: ConnectErrorData }).data;
      if (!data) return onStatus('reconnecting'); // 네트워크 오류: socket.io가 알아서 재시도
      if (FATAL.has(data.code)) {
        this.halted = true;
        return onStatus('failed', data.code);
      }
      // 미들웨어 거절은 자동 재연결되지 않으므로 직접 다시 연결
      onStatus('reconnecting', data.code);
      this.retryLater(data.retryAfterMs ?? jitter(2000, 8000));
    });
    socket.on('session:end', (msg) => {
      onMessage({ type: 'session:end', payload: msg });
      if (msg.reason === 'abuse') {
        this.halted = true;
        return onStatus('failed', 'abuse');
      }
      onStatus('reconnecting');
      this.retryLater(msg.retryAfterMs ?? jitter(1000, 5000));
    });
    (Object.keys(PUSH_EVENTS) as (keyof ServerToClientEvents)[])
      .filter((name) => name !== 'session:end')
      .forEach((name) => {
        socket.on(name, ((payload: unknown) => onMessage({ type: name, payload } as ServerMessage)) as never);
      });
  }

  async request<K extends RequestName>(name: K, req: RequestOf<K>): Promise<Ack<ResultOf<K>>> {
    const socket = this.socket;
    if (!socket?.connected) return { ok: false, error: { code: 'unavailable' } };
    try {
      const timed = socket.timeout(ACK_TIMEOUT_MS);
      const emitWithAck = timed.emitWithAck as unknown as (ev: K, r: RequestOf<K>) => Promise<Ack<ResultOf<K>>>;
      return await emitWithAck.call(timed, name, req);
    } catch {
      this.reconnect(); // ack 타임아웃 → 끊고 재연결 경로로
      return { ok: false, error: { code: 'unavailable' } };
    }
  }

  sendPos(pos: PosTuple): void {
    // 끊긴 동안의 pos는 버린다(버퍼링하면 재연결 직후 몰려 간다)
    if (this.socket?.connected) this.socket.volatile.emit('pos', pos);
  }

  reconnect(): void {
    this.socket?.disconnect();
    this.retryLater(0);
  }

  disconnect(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.disconnect();
    this.socket?.removeAllListeners();
    this.socket = null;
  }

  private retryLater(ms: number) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.socket?.connect();
    }, ms);
  }
}
