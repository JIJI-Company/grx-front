// 무한성 화면 문자열·색. 순수 함수만 둔다.
import type { CastleHallSummary } from '../../api/types';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import { CASTLE_LIMITS, type CastleErrorCode } from '../../castle/protocol';
import type { CastleProblem } from '../../castle/store';
import { transitionPlan, type TransitionKind, type TransitionPhase } from '../../castle/transition';
import type { ConnectionStatus } from '../../castle/transport';
import type { CameraView } from '../../castle/view';
import type { CSSProperties } from 'react';

export const HORN_COLORS = [
  { value: '#facc15', label: '금빛 뿔' },
  { value: '#e11d48', label: '주홍 뿔' },
  { value: '#a855f7', label: '보랏빛 뿔' },
  { value: '#14b8a6', label: '청록 뿔' },
  { value: '#f97316', label: '주황 뿔' },
  { value: '#e5e7eb', label: '흰 뿔' },
] as const;

export const DEFAULT_NICKNAME = '오니';
export const NICKNAME_MAX = CASTLE_LIMITS.nicknameMax;

/** 마지막 글자 받침 유무로 조사 선택 (이/가) */
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}${without}`;
  return `${word}${code % 28 ? withBatchim : without}`;
}

export function populationLabel(count: number): string {
  return `같은 층 ${count}명`;
}

export function hallPopulationLabel(hall: CastleHallSummary): string {
  return `${hall.total} / ${hall.capacity}`;
}

export function statueCaption(s: PlacedStatue): string {
  return `${s.rankName} · ${s.name}`;
}

export function lanternCountLabel(count: number): string {
  return `등롱 ${count}`;
}

/** 이미 바친 등롱이 아직 유효하면 연장 */
export function lanternActionLabel(s: PlacedStatue, myExpiry: number | null, now = Date.now()): string {
  return myExpiry !== null && myExpiry > now ? `${s.name}의 등롱 7일 연장` : `${s.name}에게 등롱 바치기`;
}

export function memberInfoLabel(s: PlacedStatue): string {
  return `${s.name} 정보 보기`;
}

export function inspectLabel(inspecting: boolean): string {
  return inspecting ? '둘러보기 끝' : '석상 둘러보기';
}

/** 감상 중 조작 안내 */
export function inspectHint(touch: boolean): string {
  return touch ? '오른쪽 화면을 끌어 돌려 보기 · 움직이면 끝' : '드래그로 돌려 보기 · 휠로 확대 · 움직이거나 Esc로 끝';
}

export function awakenMessage(name: string, floor: FloorDef | null): string {
  const where = floor ? `${floor.sub}에서 ` : '';
  return `${where}${josa(name, '이', '가')} 깨어났다`;
}

export function connectionLabel(status: ConnectionStatus): string | null {
  if (status === 'connecting') return '성문을 여는 중…';
  if (status === 'reconnecting') return '다시 연결하는 중…';
  if (status === 'closed' || status === 'failed') return '연결이 끊겼습니다';
  return null;
}

/** 게임 중 HUD에 띄울 문제 문구. 서버 message는 디버그용이라 쓰지 않는다 */
export function problemLabel(code: CastleProblem | null): string | null {
  switch (code) {
    case null:
      return null;
    case 'protocol_mismatch':
      return '새 버전이 있습니다. 새로고침해 주세요';
    case 'abuse':
      return '이용이 제한되었습니다';
    case 'bad_token':
    case 'origin_denied':
      return '성에 들어갈 수 없습니다';
    case 'rate_limited':
    case 'guest_limit':
      return '잠시 후 다시 시도해 주세요';
    case 'statue_wrong_floor':
    case 'statue_not_found':
      return '이 석상에는 등롱을 바칠 수 없습니다';
    default:
      return '잠시 문제가 생겼습니다';
  }
}

/** 첫 입장 거절 → 입장 화면 문구 */
export function joinRejectionLabel(code: CastleErrorCode): string {
  if (code === 'bad_request') return '사용할 수 없는 닉네임입니다. 다른 이름을 적어 주세요';
  if (code === 'hall_full') return '이 성은 가득 찼습니다. 다른 성을 골라 주세요';
  if (code === 'hall_not_found') return '닫힌 성입니다. 다른 성을 골라 주세요';
  return '입장하지 못했습니다';
}

export function viewLabel(view: CameraView): string {
  return view === 'first' ? '1인칭' : '3인칭';
}

// ── 층 이동 연출 오버레이 스타일 (castle/transition.ts의 시각표를 CSS transition으로 옮긴다)
export interface TransitionOverlay {
  kind: TransitionKind;
  phase: TransitionPhase;
  /** 덮개 색 (floors.ts 트리거 fade) */
  color: string;
  /** 층 거리 (재배치 연출 길이) */
  span: number;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** 화면 전체 덮개(페이드) */
export function coverStyle(o: TransitionOverlay | null): CSSProperties {
  if (!o) return { opacity: 0 };
  const p = transitionPlan(o.kind, o.span);
  if (o.phase === 'out') return { background: o.color, opacity: 1, transition: `opacity ${p.coverMs}ms ${EASE_IN_OUT} ${p.coverDelayMs}ms` };
  // 계단은 덮개 대신 닫힌 장지문이 열리므로 덮개는 장지문 뒤에서 금방 걷힌다. 재배치는 3D 벽이 덮고 있다가 갈라진다
  const reveal =
    o.kind === 'stairs' || o.kind === 'door'
      ? 'opacity 200ms linear 200ms'
      : o.kind === 'shift'
        ? 'opacity 150ms linear'
        : `opacity ${p.revealMs}ms ${EASE} ${p.revealDelayMs}ms`;
  return { background: o.color, opacity: 0, transition: reveal };
}

/** 장지문 한 짝 (계단 연출). out 동안은 닫힌 채 숨어 있다가 층이 바뀌면 나타나 좌우로 열린다 */
export function shojiStyle(o: TransitionOverlay, side: -1 | 1): CSSProperties {
  if (o.phase === 'out') return { opacity: 0, transform: 'translateX(0)' };
  const p = transitionPlan('stairs');
  return {
    opacity: 1,
    transform: `translateX(${side * 101}%)`,
    transition: `opacity 150ms linear, transform ${p.revealMs}ms ${EASE_IN_OUT} ${p.revealDelayMs}ms`,
  };
}
