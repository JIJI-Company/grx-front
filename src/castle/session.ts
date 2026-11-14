// 한 번의 입장 = 세션. 전송 계층·store·내 이동 상태를 묶고, 화면은 이 객체의 메서드만 부른다.
import { FIRST_FLOOR, FLOORS } from './floors';
import { LookInput, MoveInput } from './input';
import { createMotion, placeMotion, type Motion } from './movement';
import { decodePoint, encodeAt, encodePos, type CastleError, type FloorId } from './protocol';
import { createReveal } from './reveal';
import { CastleStore } from './store';
import { createTransport, type CastleTransport, type ServerMessage } from './transport';

export interface JoinProfile {
  hall: string;
  nickname: string;
  hornColor: string;
}

const SEND_INTERVAL_MS = 100; // 10Hz (서버 상한 15/s)
const MOVING = 0.05;
const RETRY_FALLBACK_MS = 3000;
/** 다시 시도해도 같은 결과인 join 에러 → 재연결하지 않는다. bad_request는 닉네임 금칙어 거절도 포함 */
const JOIN_FATAL = new Set<CastleError['code']>(['hall_not_found', 'hall_full', 'bad_request']);

export class CastleSession {
  readonly store = new CastleStore();
  readonly input = new MoveInput();
  /** 1인칭 시점 회전 (서버로 보내지 않는다) */
  readonly look = new LookInput();
  /** B3 입장 연출 진행 (접속당 한 번) */
  readonly reveal = createReveal();
  readonly motion: Motion;
  private floorId: FloorId;
  /** join ack를 받았고 floor:change ack를 기다리는 중이 아님 → pos를 보내도 된다 */
  private ready = false;
  private joinedOnce = false;
  private stopped = false;
  private lastSent = 0;
  private wasMoving = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly profile: JoinProfile,
    startFloor: FloorId = FIRST_FLOOR,
    private readonly transport: CastleTransport = createTransport(),
  ) {
    this.floorId = startFloor;
    this.motion = createMotion(...FLOORS[startFloor].spawn);
  }

  get floor(): FloorId {
    return this.floorId;
  }

  start(): void {
    this.stopped = false;
    this.transport.connect({
      onMessage: (msg) => this.handle(msg),
      onStatus: (status, code) => {
        if (this.stopped) return;
        this.ready = false;
        this.store.setConnection(status, code);
        if (status === 'open') void this.join();
      },
    });
  }

  stop(): void {
    this.stopped = true;
    this.ready = false;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.transport.disconnect();
  }

  /** 층 이동. 로컬은 즉시 도착 위치(없으면 새 층 스폰)에 두고, 서버 ack가 오면 서버가 정한 위치로 맞춘다 */
  async changeFloor(to: FloorId, arrive?: [number, number]): Promise<void> {
    this.floorId = to;
    placeMotion(this.motion, ...(arrive ?? FLOORS[to].spawn));
    if (!this.ready) return; // 아직 join 전이면 다음 join이 새 층으로 들어간다
    this.ready = false;
    this.store.beginSync();
    const res = await this.transport.request('floor:change', arrive ? { floor: to, at: encodeAt(...arrive) } : { floor: to });
    if (this.stopped || this.floorId !== to) return;
    if (!res.ok) return this.transport.reconnect(); // 재연결 → 현재 층으로 다시 join
    this.store.applyFloorSnapshot(res.data);
    this.moveTo(res.data.self);
    this.ready = true;
  }

  /** 바치기를 누른 횟수. 캐릭터가 이 값 변화를 보고 꾸벅(bow) 한다 */
  offerSeq = 0;

  async offerLantern(memberId: string): Promise<void> {
    if (!this.ready) return;
    this.offerSeq++;
    const res = await this.transport.request('lantern:offer', { memberId });
    if (this.stopped) return;
    if (res.ok) this.store.applyOffer(res.data, { x: this.motion.x, z: this.motion.z });
    else this.store.setProblem(res.error.code);
  }

  /** 매 프레임 호출. 움직이는 동안만 10Hz, 멈추면 마지막 위치를 한 번 보낸다 */
  reportMotion(now = performance.now()): void {
    if (!this.ready) return;
    const m = this.motion;
    const moving = m.speed > MOVING;
    if (moving && now - this.lastSent >= SEND_INTERVAL_MS) {
      this.transport.sendPos(encodePos(m.x, m.z, m.rot, m.speed));
      this.lastSent = now;
    } else if (!moving && this.wasMoving) {
      this.transport.sendPos(encodePos(m.x, m.z, m.rot, 0));
      this.lastSent = now;
    }
    this.wasMoving = moving;
  }

  private async join() {
    const floor = this.floorId;
    const { hall, nickname, hornColor } = this.profile;
    this.store.beginSync();
    const res = await this.transport.request('join', {
      hall,
      floor,
      nickname,
      hornColor,
      // 재접속이면 이전 위치로 복귀 (서버가 층 경계로 클램프)
      at: this.joinedOnce ? encodeAt(this.motion.x, this.motion.z) : undefined,
    });
    if (this.stopped) return;
    if (!res.ok) {
      const fatal = JOIN_FATAL.has(res.error.code);
      if (fatal && !this.joinedOnce) return this.store.rejectJoin(res.error.code);
      this.store.setProblem(res.error.code);
      if (!fatal) this.retry(res.error.retryAfterMs);
      return;
    }
    this.store.applySnapshot(res.data);
    if (this.floorId !== floor) return void this.changeFloorAfterJoin();
    this.moveTo(res.data.self);
    this.joinedOnce = true;
    this.ready = true;
  }

  /** join ack를 기다리는 사이 층을 옮겼으면 서버도 따라오게 한다 */
  private changeFloorAfterJoin() {
    this.joinedOnce = true;
    this.ready = true;
    void this.changeFloor(this.floorId);
  }

  /** 서버가 정한 위치(cm)로 맞춘다 */
  private moveTo(cm: { x: number; z: number }) {
    const { x, z } = decodePoint(cm);
    Object.assign(this.motion, { x, z, vx: 0, vz: 0 });
  }

  private retry(afterMs = RETRY_FALLBACK_MS) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.transport.reconnect(), afterMs);
  }

  private handle(msg: ServerMessage) {
    if (msg.type === 'pos:reject') {
      this.moveTo(msg.payload);
      return;
    }
    this.store.apply(msg);
  }
}
