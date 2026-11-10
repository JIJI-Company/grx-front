// 개발용 로컬 mock 서버. 백엔드 없이 혼자 돌아다니고 등롱을 바칠 수 있게 서버 규칙만 흉내 낸다.
// (join/floor:change ack로 스냅샷, 석상당 1인 1개·다시 바치면 7일 연장, 같은 층 석상만 허용)
import { mockGetCastleStatues } from '../api/mockDb';
import type { CastleStatueFloor } from '../api/types';
import { FLOORS } from './floors';
import { CASTLE_LIMITS, encodeAt, type Ack, type FloorId, type MemberId, type PosTuple } from './protocol';
import type { CastleTransport, RequestName, RequestOf, ResultOf, ServerMessage, TransportHandlers } from './transport';

const LATENCY_MS = 60;
const LANTERN_TTL_MS = CASTLE_LIMITS.lanternDays * 24 * 60 * 60 * 1000;
const SELF_ID = 1;
// 밝기 단계(0/1/5/20/50)를 한눈에 보도록 석상 순서대로 시드
const SEED_COUNTS = [0, 3, 12, 27, 64];
// 서버 금칙어 필터 흉내 (실제 목록은 서버에만 있다)
const BANNED_NICKNAME = /운영자|관리자|admin/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockTransport implements CastleTransport {
  private handlers: TransportHandlers | null = null;
  private floor: FloorId = 'B1';
  private statues: CastleStatueFloor[] | null = null;
  private lanterns = new Map<MemberId, number>();
  private mine = new Map<MemberId, string>();

  connect(handlers: TransportHandlers): void {
    this.handlers = handlers;
    handlers.onStatus('connecting');
    setTimeout(() => this.handlers?.onStatus('open'), LATENCY_MS);
  }

  async request<K extends RequestName>(name: K, req: RequestOf<K>): Promise<Ack<ResultOf<K>>> {
    await sleep(LATENCY_MS);
    return (await this.handle(name, req)) as Ack<ResultOf<K>>;
  }

  sendPos(_pos: PosTuple): void {} // 혼자이므로 중계할 상대가 없다

  reconnect(): void {
    this.handlers?.onStatus('reconnecting');
    setTimeout(() => this.handlers?.onStatus('open'), LATENCY_MS);
  }

  disconnect(): void {
    this.handlers?.onStatus('closed');
    this.handlers = null;
  }

  private async handle(name: RequestName, req: RequestOf<RequestName>): Promise<Ack<unknown>> {
    await this.load();
    if (name === 'join') {
      const r = req as RequestOf<'join'>;
      if (BANNED_NICKNAME.test(r.nickname)) return { ok: false, error: { code: 'bad_request', message: 'nickname rejected' } };
      this.floor = r.floor;
      const [x, z] = r.at ?? encodeAt(...FLOORS[r.floor].spawn);
      return {
        ok: true,
        data: {
          self: { id: SELF_ID, floor: r.floor, x, z },
          hall: { slug: r.hall, name: r.hall, capacity: CASTLE_LIMITS.hallCapacityDefault },
          peers: [],
          lanterns: [...this.lanterns].map(([memberId, count]) => ({ memberId, count })),
          mine: [...this.mine].map(([memberId, expiresAt]) => ({ memberId, expiresAt })),
          live: this.statues!.flatMap((f) => f.statues.filter((s) => s.isLive).map((s) => s.memberId)),
          serverTime: Date.now(),
        } satisfies ResultOf<'join'>,
      };
    }
    if (name === 'floor:change') {
      const { floor } = req as RequestOf<'floor:change'>;
      this.floor = floor;
      const [x, z] = encodeAt(...FLOORS[floor].spawn);
      return { ok: true, data: { self: { id: SELF_ID, floor, x, z }, peers: [] } satisfies ResultOf<'floor:change'> };
    }
    const { memberId } = req as RequestOf<'lantern:offer'>;
    const statueFloor = this.statues!.find((f) => f.statues.some((s) => s.memberId === memberId));
    if (!statueFloor) return { ok: false, error: { code: 'statue_not_found' } };
    if (statueFloor.floor !== this.floor) return { ok: false, error: { code: 'statue_wrong_floor' } };
    const prev = this.mine.get(memberId);
    const extended = !!prev && Date.parse(prev) > Date.now();
    const expiresAt = new Date(Date.now() + LANTERN_TTL_MS).toISOString();
    this.mine.set(memberId, expiresAt);
    const count = (this.lanterns.get(memberId) ?? 0) + (extended ? 0 : 1);
    this.lanterns.set(memberId, count);
    const asOf = Date.now();
    this.push({ type: 'lantern:count', payload: { memberId, count, asOf } }); // 서버는 네임스페이스 전체에 보낸다
    return { ok: true, data: { memberId, expiresAt, extended, count, asOf } satisfies ResultOf<'lantern:offer'> };
  }

  private async load() {
    if (this.statues) return;
    this.statues = await mockGetCastleStatues();
    this.statues.flatMap((f) => f.statues).forEach((s, i) => this.lanterns.set(s.memberId, SEED_COUNTS[i % SEED_COUNTS.length]));
  }

  private push(msg: ServerMessage) {
    setTimeout(() => this.handlers?.onMessage(msg), LATENCY_MS);
  }
}
