// 입장 후 화면: 캔버스 + HUD + 층 이동 연출 + 등롱 바치기 + 1인칭/3인칭. 상태 변경은 세션 메서드로만 한다.
// 층 이동 연출은 시간표(castle/transition.ts)대로만 진행한다. 서버 floor:change ack는 세션이 따로 기다리므로
// ack가 늦거나 실패해도(세션이 재연결) 화면이 가려진 채 멈추지 않는다.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useProgress } from '@react-three/drei';
import type { CastleStatueFloor, Member } from '../../api/types';
import { findStatue, FLOORS, galleryFloor, historyFloor, inRect, placeStatues, PLAZA_BOARD, PLAZA_CENTER, type PlacedStatue } from '../../castle/floors';
import { MOUSE_SENSITIVITY, TOUCH_SENSITIVITY } from '../../castle/input';
import { initialInspect, turnInspect, zoomInspect } from '../../castle/orbit';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import { castleSound } from '../../castle/sound';
import { useCastleStore } from '../../castle/store';
import { effectiveKind, transitionEndMs, transitionPlan, transitionRoute, type ActiveTransition, type TransitionKind } from '../../castle/transition';
import { allLampsOn } from '../../castle/reveal';
import { loadView, saveView, type CameraView } from '../../castle/view';
import { useMembers } from '../../hooks/useMembers';
import { hallEndZ } from './spaces/historyHallPresentation';
import { useHallData } from './spaces/useHallData';
import { usePlazaData } from './spaces/usePlazaData';
import { galleryEndZ, lastColumnZ, posterDate } from './spaces/galleryPresentation';
import { useContentsArchive } from '../../hooks/useContent';
import type { ContentsArchiveItem } from '../../api/types';
import MemberModal from '../members/MemberModal';
import CastleCanvas from './CastleCanvas';
import type { InspectState } from './FollowCamera';
import {
  awakenMessage,
  connectionLabel,
  inspectHint,
  inspectLabel,
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
/** 광장 게시판에서 이만큼 가까우면 이번 주 일정 목록을 띄운다(m) */
const BOARD_RADIUS = 4;

interface CastleGameProps {
  session: CastleSession;
  statues: CastleStatueFloor[];
  statuesError: boolean;
}

export default function CastleGame({ session, statues, statuesError }: CastleGameProps) {
  const { store } = session;
  useCastleStore(store);
  // 첫 장면 에셋(GLB·텍스처) 로딩이 끝나면 로딩 시간을 한 번 보낸다
  const assets = useProgress();
  useEffect(() => {
    if (!assets.active && assets.total > 0) session.telemetry.loaded();
  }, [assets.active, assets.total, session]);
  const [floorId, setFloorId] = useState<FloorId>(session.floor);
  const [near, setNear] = useState<PlacedStatue | null>(null);
  const [overlay, setOverlay] = useState<TransitionOverlay | null>(null);
  /** 3D 연출이 매 프레임 읽는 진행 중인 연출 */
  const fx = useRef<ActiveTransition | null>(null);
  /** 석상 감상 시점: 카메라가 매 프레임 읽는다. 화면 표시는 inspecting으로 */
  const inspect = useRef<InspectState | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [view, setView] = useState<CameraView>(loadView);
  const [locked, setLocked] = useState(false);
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
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
  // History 전당: 기록 수로 길이가 정해진다 (장면과 걷기 영역이 같은 값을 쓴다)
  const hall = useHallData();
  const plaza = usePlazaData();
  // Content 화랑(PoC): 포스터 수로 길이가 정해진다. 가까이 간 포스터는 화면 아래에 제목을 띄운다
  const { data: contents } = useContentsArchive();
  const [nearPoster, setNearPoster] = useState<ContentsArchiveItem | null>(null);
  const gallery = useMemo(() => ({ items: contents ?? [], onNear: setNearPoster }), [contents]);
  const floor = useMemo(() => {
    if (floorId === 'HISTORY') return historyFloor(hallEndZ(hall.records));
    if (floorId === 'CONTENT') return galleryFloor(galleryEndZ(gallery.items.length), lastColumnZ(gallery.items.length) - 1.3);
    return FLOORS[floorId];
  }, [floorId, hall.records, gallery.items.length]);
  const placed = useMemo(() => placeStatues(floor, statues), [floor, statues]);

  useEffect(() => session.input.attach(), [session]);

  // 닫힌 문 같은 안내: 내 위치가 안내 구역에 들어가면 화면 아래에 한 줄. 광장 게시판 앞이면 이번 주 일정 목록
  const [sign, setSign] = useState<string | null>(null);
  const [atBoard, setAtBoard] = useState(false);
  useEffect(() => {
    const signs = floor.signs ?? [];
    const t = setInterval(() => {
      const m = session.motion;
      setSign(signs.find((s) => inRect(s.rect, m.x, m.z))?.text ?? null);
      setAtBoard(floor.id === 'PLAZA' && Math.hypot(m.x - PLAZA_BOARD.x, m.z - PLAZA_BOARD.z) < BOARD_RADIUS);
    }, 200);
    return () => clearInterval(t);
  }, [floor, session]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    castleSound.ambience(floorId);
    const t = setTimeout(() => setBanner(null), BANNER_MS);
    return () => clearTimeout(t);
  }, [floorId]);
  useEffect(() => () => castleSound.ambience(null), []);

  const onTrigger = useCallback(
    (to: FloorId, color: string, effect: TransitionKind, arrive?: [number, number]) => {
      const kind = effectiveKind(effect, reducedMotion);
      const route = transitionRoute(session.floor, to);
      const plan = transitionPlan(kind, route.span);
      session.motion.frozen = true;
      inspect.current = null;
      setInspecting(false);
      castleSound.cue(to === 'B3' ? 'fall' : 'descend');
      fx.current = { kind, phase: 'out', start: performance.now(), ...route };
      setOverlay({ kind, phase: 'out', color, span: route.span });
      timers.current.push(
        setTimeout(() => {
          void session.changeFloor(to, arrive);
          session.look.reset(); // 새 층에서는 앞(-z)을 보고 시작
          setFloorId(to);
          setBanner(to);
          fx.current = { kind, phase: 'in', start: performance.now(), ...route };
          setOverlay({ kind, phase: 'in', color, span: route.span });
          timers.current.push(
            setTimeout(() => (session.motion.frozen = false), plan.revealDelayMs),
            setTimeout(() => {
              fx.current = null;
              setOverlay(null);
            }, transitionEndMs(kind, route.span)),
          );
        }, plan.switchMs),
      );
    },
    [session, reducedMotion],
  );

  // HUD에서 층을 직접 고름: 건물을 오가면 문 연출, 그 밖에는 위·아래 모두 재배치 연출
  const pickFloor = useCallback(
    (to: FloorId) => {
      if (session.motion.frozen || to === floorId) return;
      // 광장이 맨 위, 지하로 갈수록 아래. 전당처럼 광장 옆 건물은 문 연출
      const building = (f: FloorId) => f === 'HISTORY' || f === 'CONTENT';
      if (building(to) || building(floorId)) return onTrigger(to, '#000000', 'door', to === 'PLAZA' ? PLAZA_CENTER : undefined);
      onTrigger(to, '#000000', 'shift');
    },
    [session, floorId, onTrigger],
  );

  const onNear = useCallback((s: PlacedStatue | null) => {
    nearRef.current = s;
    setNear(s);
    if (s) session.telemetry.statueVisit(s.memberId, s.name, session.store.isLive(s.memberId));
    if (!s) {
      inspect.current = null;
      setInspecting(false);
    }
  },[session]);

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

  // 석상 앞 F → 석상 감상: 카메라가 석상을 중심으로 돈다(드래그·휠). 움직이거나 F·Esc로 끝
  const stopInspect = useCallback(() => {
    inspect.current = null;
    setInspecting(false);
  }, []);
  const startInspect = useCallback(() => {
    const s = nearRef.current;
    if (!s || session.motion.frozen) return;
    inspect.current = { statue: s, view: initialInspect() };
    setInspecting(true);
    if (document.pointerLockElement) document.exitPointerLock();
  }, [session]);
  const toggleInspect = useCallback(() => (inspect.current ? stopInspect() : startInspect()), [startInspect, stopInspect]);

  useEffect(() => {
    if (!inspecting) return;
    const t = setInterval(() => {
      const axis = session.input.read();
      if (axis.x !== 0 || axis.z !== 0) stopInspect();
    }, 80);
    return () => clearInterval(t);
  }, [inspecting, session, stopInspect]);

  /** 화면 드래그 → 감상 중이면 석상 회전, 3인칭이면 꾸로 중심 카메라 회전(yaw만), 1인칭이면 둘러보기 */
  const turnView = useCallback(
    (dx: number, dy: number, sensitivity: number) => {
      if (inspect.current) turnInspect(inspect.current.view, dx, dy, sensitivity);
      else if (view === 'third') session.look.turn(dx, 0, sensitivity);
      else session.look.turn(dx, dy, sensitivity);
    },
    [view, session],
  );

  // 데스크톱 마우스 드래그 (1인칭은 포인터 락이 따로 처리)
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const dragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || (view === 'first' && !inspect.current)) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const dragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    turnView(e.clientX - d.x, e.clientY - d.y, MOUSE_SENSITIVITY * 1.4);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const dragEnd = () => (drag.current = null);
  useEffect(() => {
    const el = spaceRef.current;
    if (!el || !inspecting) return;
    // passive가 아니어야 페이지 스크롤을 막을 수 있다
    const wheel = (e: WheelEvent) => {
      if (!inspect.current) return;
      e.preventDefault();
      zoomInspect(inspect.current.view, e.deltaY);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [inspecting]);

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

  // B3 다리의 마지막 등이 켜지면 3인칭으로 물러나 석상이 드러나는 장면을 보여 준다 (접속당 한 번, 설정은 저장하지 않는다)
  const pulledBack = useRef(false);
  useEffect(() => {
    if (floorId !== 'B3' || pulledBack.current) return;
    const t = setInterval(() => {
      if (!allLampsOn(session.reveal)) return;
      pulledBack.current = true;
      clearInterval(t);
      if (view !== 'first') return;
      session.look.reset();
      setView('third');
    }, 100);
    return () => clearInterval(t);
  }, [floorId, view, session]);

  const toggleView = useCallback(() => {
    const next: CameraView = view === 'first' ? 'third' : 'first';
    saveView(next);
    session.look.reset();
    setView(next);
    if (next === 'first' && !infoMemberId && !inspect.current) lockPointer();
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
      if (e.code === 'KeyF' && !infoMemberId) {
        toggleInspect();
        return;
      }
      if (e.code === 'Escape' && inspect.current) {
        stopInspect();
        return;
      }
      if (e.code === 'Space' && !infoMemberId) offer();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [offer, openInfo, closeInfo, infoMemberId, toggleView, toggleInspect, stopInspect]);

  const awaken = store.lastAwaken;
  const awakened = awaken?.isLive ? findStatue(statues, awaken.memberId) : null;
  const awakenSeq = awakened ? awaken?.seq : undefined;
  useEffect(() => {
    if (awakenSeq) castleSound.cue('awaken');
  }, [awakenSeq]);

  return (
    <div className="relative h-full">
      <FloorTransition overlay={overlay} banner={banner ? FLOORS[banner] : null}>
        <div
          ref={spaceRef}
          className={`h-full ${(view === 'third' || inspecting) && !coarse ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onClick={() => view === 'first' && !infoMemberId && !inspect.current && lockPointer()}
          onPointerDown={dragStart}
          onPointerMove={dragMove}
          onPointerUp={dragEnd}
          onPointerCancel={dragEnd}
        >
          <CastleCanvas session={session} floor={floor} statues={placed} onTrigger={onTrigger} onNear={onNear} view={view} inspect={inspect} fx={fx} hall={hall} plaza={plaza} gallery={gallery} />
        </div>
      </FloorTransition>
      <LookPad onTurn={(dx, dy) => turnView(dx, dy, TOUCH_SENSITIVITY)} />
      <Hud
        floor={floor}
        onPickFloor={pickFloor}
        population={populationLabel(store.population)}
        connection={connectionLabel(store.status)}
        notice={problemLabel(store.problem) ?? (statuesError ? '석상 정보를 불러오지 못했습니다' : null)}
        view={view}
        onToggleView={toggleView}
        lookHint={view === 'first' && !locked && !coarse && !infoMember && !inspecting}
      />
      {atBoard && (
        <section
          aria-label="이번 주 일정"
          className="pointer-events-none absolute top-1/2 right-6 w-72 -translate-y-1/2 border border-gold-400/40 bg-castle-950/85 px-5 py-4 shadow-[0_0_24px_#000] transition duration-300 starting:opacity-0"
        >
          <h3 className="text-xs tracking-[0.4em] text-gold-400">이번 주 일정</h3>
          {plaza.days.length ? (
            <ul className="mt-3 max-h-[80vh] space-y-2 overflow-hidden">
              {plaza.days.map((d) => (
                <li key={d.date}>
                  <p className={`text-[11px] tracking-[0.1em] ${d.isToday ? 'text-gold-400' : 'text-ruby-500'}`}>{d.isToday ? `오늘 · ${d.label}` : d.label}</p>
                  {!d.events.length && <p className="mt-1 text-sm text-ink-500">일정 없음</p>}
                  <ul className="mt-1 space-y-1">
                    {d.events.map((e) => (
                      <li key={e.id} className="text-sm leading-snug text-ink-50">
                        {e.time && <span className="mr-1.5 text-[11px] text-ink-400">{e.time}</span>}
                        {e.title}
                        {e.who && <span className="ml-1.5 text-[11px] text-ink-400">{e.who}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-400">이번 주 일정이 없습니다</p>
          )}
        </section>
      )}
      {floorId === 'CONTENT' && nearPoster && (
        <div className="pointer-events-none absolute bottom-24 w-full text-center [text-shadow:0_0_8px_#000]" role="status">
          <p className="text-[11px] tracking-[0.3em] text-gold-400">{posterDate(nearPoster.date)}</p>
          <p className="mt-1 text-lg font-semibold text-ink-50">{nearPoster.title}</p>
          {!!nearPoster.members.length && <p className="mt-1 text-xs text-ink-300">{nearPoster.members.join(' · ')}</p>}
        </div>
      )}
      {sign && !near && (
        <p className="pointer-events-none absolute bottom-24 w-full text-center text-sm tracking-[0.3em] text-ink-200 [text-shadow:0_0_8px_#000]" role="status">
          {sign}
        </p>
      )}
      {near && !infoMember && (
        <LanternPrompt
          label={lanternActionLabel(near, store.myLanternExpiry(near.memberId))}
          infoLabel={memberInfoLabel(near)}
          inspectLabel={inspectLabel(inspecting)}
          inspectHint={inspecting ? inspectHint(coarse) : null}
          onOffer={offer}
          onInfo={openInfo}
          onInspect={toggleInspect}
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
