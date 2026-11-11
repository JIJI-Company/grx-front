// 입장 후 화면: 캔버스 + HUD + 층 이동 연출 + 등롱 바치기 + 1인칭/3인칭. 상태 변경은 세션 메서드로만 한다.
// 층 이동 연출은 시간표(castle/transition.ts)대로만 진행한다. 서버 floor:change ack는 세션이 따로 기다리므로
// ack가 늦거나 실패해도(세션이 재연결) 화면이 가려진 채 멈추지 않는다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CastleStatueFloor, Member } from '../../api/types';
import { findStatue, FLOORS, placeStatues, type PlacedStatue } from '../../castle/floors';
import { MOUSE_SENSITIVITY } from '../../castle/input';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import { castleSound } from '../../castle/sound';
import { useCastleStore } from '../../castle/store';
import { transitionEndMs, TRANSITIONS, type ActiveTransition, type TransitionKind } from '../../castle/transition';
import { loadView, saveView, type CameraView } from '../../castle/view';
import { useMembers } from '../../hooks/useMembers';
import MemberModal from '../members/MemberModal';
import CastleCanvas from './CastleCanvas';
import {
  awakenMessage,
  connectionLabel,
  lanternActionLabel,
  memberInfoLabel,
  populationLabel,
  problemLabel,
  type TransitionOverlay,
} from './castlePresentation';
import AwakenToast from './ui/AwakenToast';
import FloorTransition from './ui/FloorTransition';
import Hud from './ui/Hud';
import Joystick from './ui/Joystick';
import LanternPrompt from './ui/LanternPrompt';
import LookPad from './ui/LookPad';

const BANNER_MS = 3200;

interface CastleGameProps {
  session: CastleSession;
  statues: CastleStatueFloor[];
  statuesError: boolean;
}

export default function CastleGame({ session, statues, statuesError }: CastleGameProps) {
  const { store } = session;
  useCastleStore(store);
  const [floorId, setFloorId] = useState<FloorId>(session.floor);
  const [near, setNear] = useState<PlacedStatue | null>(null);
  const [overlay, setOverlay] = useState<TransitionOverlay | null>(null);
  /** 3D 연출이 매 프레임 읽는 진행 중인 연출 */
  const fx = useRef<ActiveTransition | null>(null);
  const [view, setView] = useState<CameraView>(loadView);
  const [locked, setLocked] = useState(false);
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const spaceRef = useRef<HTMLDivElement>(null);
  const [banner, setBanner] = useState<FloorId | null>(session.floor);
  const nearRef = useRef<PlacedStatue | null>(null);
  const [infoMemberId, setInfoMemberId] = useState<string | null>(null);
  const { data: memberGroups } = useMembers();
  const infoMember = useMemo<Member | null>(() => {
    if (!infoMemberId || !memberGroups) return null;
    const { master, upper, lower, new: newcomers, other = [] } = memberGroups;
    return [...master, ...upper, ...lower, ...newcomers, ...other].find((m) => m.memberId === infoMemberId) ?? null;
  }, [infoMemberId, memberGroups]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const floor = FLOORS[floorId];
  const placed = useMemo(() => placeStatues(floor, statues), [floor, statues]);

  useEffect(() => session.input.attach(), [session]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    castleSound.ambience(floorId);
    const t = setTimeout(() => setBanner(null), BANNER_MS);
    return () => clearTimeout(t);
  }, [floorId]);
  useEffect(() => () => castleSound.ambience(null), []);

  const onTrigger = useCallback(
    (to: FloorId, color: string, kind: TransitionKind) => {
      const plan = TRANSITIONS[kind];
      session.motion.frozen = true;
      castleSound.cue(to === 'B3' ? 'fall' : 'descend');
      fx.current = { kind, phase: 'out', start: performance.now() };
      setOverlay({ kind, phase: 'out', color });
      timers.current.push(
        setTimeout(() => {
          void session.changeFloor(to);
          session.look.reset(); // 새 층에서는 앞(-z)을 보고 시작
          setFloorId(to);
          setBanner(to);
          fx.current = { kind, phase: 'in', start: performance.now() };
          setOverlay({ kind, phase: 'in', color });
          timers.current.push(
            setTimeout(() => (session.motion.frozen = false), plan.revealDelayMs),
            setTimeout(() => {
              fx.current = null;
              setOverlay(null);
            }, transitionEndMs(kind)),
          );
        }, plan.switchMs),
      );
    },
    [session],
  );

  // HUD에서 층을 직접 고름: 내려가면 계단 연출, 올라가면 복귀 연출
  const pickFloor = useCallback(
    (to: FloorId) => {
      if (session.motion.frozen || to === floorId) return;
      onTrigger(to, '#000000', to > floorId ? 'stairs' : 'return');
    },
    [session, floorId, onTrigger],
  );

  const onNear = useCallback((s: PlacedStatue | null) => {
    nearRef.current = s;
    setNear(s);
  }, []);

  const offer = useCallback(() => {
    const s = nearRef.current;
    if (!s || session.motion.frozen) return;
    void session.offerLantern(s.memberId);
    castleSound.cue('offer');
  }, [session]);

  // 석상 앞 E → 멤버 정보(반투명). 움직이면 저절로 닫힌다 (Esc·E·바깥 클릭으로도 닫기)
  const openInfo = useCallback(() => {
    const s = nearRef.current;
    if (!s || session.motion.frozen) return;
    setInfoMemberId(s.memberId);
  }, [session]);
  const closeInfo = useCallback(() => setInfoMemberId(null), []);

  useEffect(() => {
    if (!infoMemberId) return;
    // 키보드·조이스틱 모두 같은 입력에서 읽으므로 이동 의도가 생기면 닫는다
    const t = setInterval(() => {
      const axis = session.input.read();
      if (axis.x !== 0 || axis.z !== 0) setInfoMemberId(null);
    }, 80);
    return () => clearInterval(t);
  }, [infoMemberId, session]);

  // ── 1인칭 시점: 데스크톱은 포인터 락 마우스(Esc 해제), 모바일은 LookPad 드래그
  const lockPointer = useCallback(() => {
    const canvas = spaceRef.current?.querySelector('canvas');
    if (!canvas || coarse || document.pointerLockElement === canvas) return;
    try {
      // 최신 브라우저는 Promise를 돌려준다. 거절(사용자 조작 없음 등)은 무시하고 다음 클릭에 다시 건다
      void (canvas.requestPointerLock() as unknown as Promise<void> | undefined)?.catch(() => {});
    } catch {
      // 포인터 락을 지원하지 않는 환경
    }
  }, [coarse]);

  const toggleView = useCallback(() => {
    const next: CameraView = view === 'first' ? 'third' : 'first';
    saveView(next);
    session.look.reset();
    setView(next);
    if (next === 'first' && !infoMemberId) lockPointer();
  }, [view, session, infoMemberId, lockPointer]);

  // 3인칭이거나 정보 창이 떠 있으면 포인터 락을 푼다
  useEffect(() => {
    if ((view === 'third' || infoMemberId) && document.pointerLockElement) document.exitPointerLock();
  }, [view, infoMemberId]);

  useEffect(() => {
    const change = () => setLocked(!!document.pointerLockElement);
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement) session.look.turn(e.movementX, e.movementY, MOUSE_SENSITIVITY);
    };
    document.addEventListener('pointerlockchange', change);
    document.addEventListener('mousemove', move);
    return () => {
      document.removeEventListener('pointerlockchange', change);
      document.removeEventListener('mousemove', move);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [session]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyV') {
        toggleView();
        return;
      }
      if (e.code === 'KeyE') {
        if (infoMemberId) closeInfo();
        else openInfo();
        return;
      }
      if (e.code === 'Space' && !infoMemberId) offer();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [offer, openInfo, closeInfo, infoMemberId, toggleView]);

  const awaken = store.lastAwaken;
  const awakened = awaken?.isLive ? findStatue(statues, awaken.memberId) : null;
  const awakenSeq = awakened ? awaken?.seq : undefined;
  useEffect(() => {
    if (awakenSeq) castleSound.cue('awaken');
  }, [awakenSeq]);

  return (
    <div className="relative h-full">
      <FloorTransition overlay={overlay} banner={banner ? FLOORS[banner] : null}>
        <div ref={spaceRef} className="h-full" onClick={() => view === 'first' && !infoMemberId && lockPointer()}>
          <CastleCanvas session={session} floor={floor} statues={placed} onTrigger={onTrigger} onNear={onNear} view={view} fx={fx} />
        </div>
      </FloorTransition>
      {view === 'first' && <LookPad look={session.look} />}
      <Hud
        floor={floor}
        onPickFloor={pickFloor}
        population={populationLabel(store.population)}
        connection={connectionLabel(store.status)}
        notice={problemLabel(store.problem) ?? (statuesError ? '석상 정보를 불러오지 못했습니다' : null)}
        view={view}
        onToggleView={toggleView}
        lookHint={view === 'first' && !locked && !coarse && !infoMember}
      />
      {near && !infoMember && (
        <LanternPrompt
          label={lanternActionLabel(near, store.myLanternExpiry(near.memberId))}
          infoLabel={memberInfoLabel(near)}
          onOffer={offer}
          onInfo={openInfo}
        />
      )}
      {infoMember && (
        // 게임 화면이 비쳐 보이도록 기존 멤버 창을 반투명하게 (전역 스타일은 건드리지 않음)
        <div className="[&_.member-modal-content]:opacity-85 [&_.modal-overlay]:bg-black/25! [&_.modal-overlay]:backdrop-filter-none!">
          <MemberModal member={infoMember} onClose={closeInfo} />
        </div>
      )}
      <Joystick input={session.input} />
      <AwakenToast message={awakened ? awakenMessage(awakened.name, awakened.floor) : null} seq={awaken?.seq ?? 0} />
    </div>
  );
}
