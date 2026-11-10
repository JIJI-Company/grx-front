// 입장 후 화면: 캔버스 + HUD + 층 이동 연출 + 등롱 바치기. 상태 변경은 세션 메서드로만 한다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CastleStatueFloor, Member } from '../../api/types';
import { findStatue, FLOORS, placeStatues, type PlacedStatue } from '../../castle/floors';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import { castleSound } from '../../castle/sound';
import { useCastleStore } from '../../castle/store';
import { useMembers } from '../../hooks/useMembers';
import MemberModal from '../members/MemberModal';
import CastleCanvas from './CastleCanvas';
import { awakenMessage, connectionLabel, lanternActionLabel, memberInfoLabel, populationLabel, problemLabel } from './castlePresentation';
import AwakenToast from './ui/AwakenToast';
import FloorTransition from './ui/FloorTransition';
import Hud from './ui/Hud';
import Joystick from './ui/Joystick';
import LanternPrompt from './ui/LanternPrompt';

const FADE_OUT_MS = 900; // 암전까지
const FADE_IN_DELAY_MS = 350; // 새 층 로드 후 밝아지기까지
const BANNER_MS = 2600;

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
  const [fade, setFade] = useState({ color: '#000000', opaque: false });
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
    (to: FloorId, color: string) => {
      session.motion.frozen = true;
      castleSound.cue(to === 'B3' ? 'fall' : 'descend');
      setBanner(to);
      setFade({ color, opaque: true });
      timers.current.push(
        setTimeout(() => {
          void session.changeFloor(to);
          setFloorId(to);
          timers.current.push(
            setTimeout(() => {
              setFade((f) => ({ ...f, opaque: false }));
              session.motion.frozen = false;
            }, FADE_IN_DELAY_MS),
          );
        }, FADE_OUT_MS),
      );
    },
    [session],
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyE') {
        if (infoMemberId) closeInfo();
        else openInfo();
        return;
      }
      if (e.code === 'Space' && !infoMemberId) offer();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [offer, openInfo, closeInfo, infoMemberId]);

  const awaken = store.lastAwaken;
  const awakened = awaken?.isLive ? findStatue(statues, awaken.memberId) : null;
  const awakenSeq = awakened ? awaken?.seq : undefined;
  useEffect(() => {
    if (awakenSeq) castleSound.cue('awaken');
  }, [awakenSeq]);

  return (
    <div className="relative h-full">
      <CastleCanvas session={session} floor={floor} statues={placed} onTrigger={onTrigger} onNear={onNear} />
      <Hud
        floor={floor}
        population={populationLabel(store.population)}
        connection={connectionLabel(store.status)}
        notice={problemLabel(store.problem) ?? (statuesError ? '석상 정보를 불러오지 못했습니다' : null)}
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
      <FloorTransition fade={fade.color} opaque={fade.opaque} banner={banner ? FLOORS[banner] : null} />
    </div>
  );
}
