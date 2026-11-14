// 무한성 접속 품질 계측 → Amplitude. 수평 확장(인스턴스·Redis 어댑터) 판단의 근거가 되는
// 클라이언트 쪽 지표 — 연결 지연, ack 왕복 시간, 거절 코드, 틱 수신량, 프레임 — 를 남긴다.
// 서버 쪽 인스턴스별 집계는 castle.gateway.ts logStats(1분 로그)가 맡는다.
import { flushAnalytics, track } from '../utils/analytics';
import type { Ack, FloorId } from './protocol';
import type { ConnectionStatus } from './transport';

const HEARTBEAT_MS = 60_000;
/** 이보다 긴 틱 간격은 "아무도 안 움직임"이라 지연 분포에서 뺀다 */
const TICK_GAP_CAP_MS = 2000;

export interface CastleLiveState {
  floor: FloorId;
  /** 같은 층 인원 (나 포함) */
  peers: number;
}

type Ok = Ack<unknown>;

const ms = (since: number) => Math.round(performance.now() - since);
const okProps = (r: Ok) => (r.ok ? { ok: true } : { ok: false, code: r.error.code });

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]);
}

export class CastleTelemetry {
  private startedAt = 0;
  private connectingAt = 0;
  private lastStatus = '';
  private reconnects = 0;
  private floorChanges = 0;
  private offers = 0;
  // 하트비트 창 (60초마다 비운다)
  private ticks = 0;
  private entries = 0;
  private lastTickAt = 0;
  private tickGaps: number[] = [];
  private frames = 0;
  private raf = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private live: () => CastleLiveState = () => ({ floor: 'PLAZA', peers: 1 });
  private readonly onPageHide = () => this.end('pagehide');

  start(live: () => CastleLiveState): void {
    this.live = live;
    this.startedAt = this.connectingAt = performance.now();
    const frame = () => {
      this.frames++;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
    this.timer = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    window.addEventListener('pagehide', this.onPageHide);
  }

  /** 상태가 바뀔 때만 보낸다 (재시도 루프가 같은 코드를 반복해도 한 번) */
  status(status: ConnectionStatus, code?: string): void {
    const key = `${status}:${code ?? ''}`;
    if (key === this.lastStatus) return;
    const wasReconnecting = this.lastStatus.startsWith('reconnecting');
    this.lastStatus = key;
    if (status === 'open') return track('castle_connect', { connect_ms: ms(this.connectingAt), reconnects: this.reconnects });
    if (!wasReconnecting) {
      this.connectingAt = performance.now();
      if (status === 'reconnecting') this.reconnects++;
    }
    if (status !== 'connecting') track('castle_connection_problem', { status, code: code ?? 'network', ...this.live() });
  }

  join(started: number, r: Ok, info: { rejoin: boolean; hall: string; floor: FloorId; peers?: number; capacity?: number }): void {
    track('castle_join', { ...okProps(r), rtt_ms: ms(started), ...info });
  }

  floorChange(started: number, r: Ok, from: FloorId, to: FloorId, peers?: number): void {
    this.floorChanges++;
    track('castle_floor_change', { ...okProps(r), rtt_ms: ms(started), from, to, peers });
  }

  offer(started: number, r: Ok, extended?: boolean): void {
    this.offers++;
    track('castle_lantern_offer', { ...okProps(r), rtt_ms: ms(started), extended });
  }

  tick(entries: number): void {
    const now = performance.now();
    if (this.lastTickAt && now - this.lastTickAt < TICK_GAP_CAP_MS) this.tickGaps.push(now - this.lastTickAt);
    this.lastTickAt = now;
    this.ticks++;
    this.entries += entries;
  }

  /** 세션 종료(라우트 이탈·탭 닫기). 한 번만 보낸다 */
  end(reason: 'leave' | 'pagehide' = 'leave'): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pagehide', this.onPageHide);
    track('castle_session_end', {
      reason,
      duration_s: Math.round((performance.now() - this.startedAt) / 1000),
      reconnects: this.reconnects,
      floor_changes: this.floorChanges,
      offers: this.offers,
      ...this.live(),
    });
    flushAnalytics();
  }

  private heartbeat() {
    // 숨은 탭은 rAF·소켓 처리가 멈춰 지표가 왜곡된다
    if (document.hidden) return this.resetWindow();
    const gaps = this.tickGaps.sort((a, b) => a - b);
    const sec = HEARTBEAT_MS / 1000;
    track('castle_heartbeat', {
      ...this.live(),
      status: this.lastStatus.split(':')[0],
      fps: Math.round(this.frames / sec),
      ticks_per_s: +(this.ticks / sec).toFixed(1),
      tick_entries_per_s: +(this.entries / sec).toFixed(1),
      tick_gap_p50_ms: percentile(gaps, 0.5),
      tick_gap_p95_ms: percentile(gaps, 0.95),
    });
    this.resetWindow();
  }

  private resetWindow() {
    this.ticks = this.entries = this.frames = 0;
    this.tickGaps = [];
  }
}
