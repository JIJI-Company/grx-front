// 무한성 접속 품질 계측 → Amplitude. 수평 확장(인스턴스·Redis 어댑터) 판단의 근거가 되는
// 클라이언트 쪽 지표 — 연결 지연, ack 왕복 시간, 거절 코드, 틱 수신량, 프레임 — 를 남긴다.
// 서버 쪽 인스턴스별 집계는 castle.gateway.ts logStats(1분 로그)가 맡는다.
import { flushAnalytics, track } from '../utils/analytics';
import { isLowSpec } from './quality';
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
  /** 세션 생성(입장 클릭·저장된 입장 복귀) 시각 — 로딩·체류 시간의 기준 */
  private readonly startedAt = performance.now();
  private connectingAt = this.startedAt;
  private lastStatus = '';
  private reconnects = 0;
  private floorChanges = 0;
  private offers = 0;
  private floorSince = this.startedAt;
  private loadedSent = false;
  /** 이번 접속에서 방송 시작(statue:awaken)을 받은 시각 */
  private readonly awakenAt = new Map<string, number>();
  /** 석상 접근은 (석상, 방송 여부)마다 한 번만 */
  private readonly visited = new Set<string>();
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
    this.connectingAt = performance.now();
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
    track('castle_floor_change', { ...okProps(r), rtt_ms: ms(started), from, to, peers, from_dwell_s: this.dwell() });
    this.floorSince = performance.now();
  }

  offer(started: number, r: Ok, extended?: boolean): void {
    this.offers++;
    track('castle_lantern_offer', { ...okProps(r), rtt_ms: ms(started), extended });
  }

  /** 첫 장면의 에셋(GLB 등) 로딩이 끝났을 때 한 번. 로딩 시간과 기기 사양 */
  loaded(): void {
    if (this.loadedSent) return;
    this.loadedSent = true;
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const glb = res.filter((e) => e.name.includes('.glb'));
    const chunk = res.find((e) => /\/CastlePage-[^/]+\.js/.test(e.name));
    const nav = navigator as Navigator & { deviceMemory?: number };
    track('castle_load', {
      ready_ms: ms(this.startedAt),
      chunk_ms: chunk ? Math.round(chunk.duration) : undefined,
      glb_count: glb.length,
      glb_cached: glb.filter((e) => e.transferSize === 0).length,
      glb_kb: Math.round(glb.reduce((n, e) => n + e.transferSize, 0) / 1024),
      glb_max_ms: glb.length ? Math.round(Math.max(...glb.map((e) => e.duration))) : undefined,
      low_spec: isLowSpec(),
      gpu: gpuName(),
      dpr: window.devicePixelRatio,
      screen: `${window.screen.width}x${window.screen.height}`,
      cores: navigator.hardwareConcurrency,
      memory_gb: nav.deviceMemory,
    });
  }

  awaken(memberId: string, isLive: boolean): void {
    if (isLive) this.awakenAt.set(memberId, performance.now());
  }

  /** 석상 앞에 섰다. 방송 시작 알림 뒤 몇 초 만에 왔는지 보면 실시간 알림의 효과가 보인다 */
  statueVisit(memberId: string, name: string, live: boolean): void {
    const key = `${memberId}:${live}`;
    if (this.visited.has(key)) return;
    this.visited.add(key);
    const at = this.awakenAt.get(memberId);
    track('castle_statue_visit', {
      member: name,
      live,
      since_awaken_s: live && at ? Math.round((performance.now() - at) / 1000) : undefined,
      ...this.live(),
    });
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
      last_floor_dwell_s: this.dwell(),
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

  private dwell() {
    return Math.round((performance.now() - this.floorSince) / 1000);
  }

  private resetWindow() {
    this.ticks = this.entries = this.frames = 0;
    this.tickGaps = [];
  }
}

/** WebGL 렌더러 이름 (예: "ANGLE (Apple, Apple M2, OpenGL 4.1)"). 이미 만든 컨텍스트를 다시 얻는다 */
function gpuName(): string | undefined {
  const gl = document.querySelector('canvas')?.getContext('webgl2');
  if (!gl) return undefined;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
}
