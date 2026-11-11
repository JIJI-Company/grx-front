// 내 캐릭터: 매 프레임 입력 → 이동 → 트리거·석상 판정 → 전송. React state를 거치지 않는다.
// 이동은 카메라가 보는 방향 기준 (3인칭은 yaw 0이라 화면 기준과 같다). 1인칭이면 내 몸(그림자 포함)은 그리지 않는다.
import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { walkAreaOf, type FloorDef, type PlacedStatue } from '../../castle/floors';
import { toWorld } from '../../castle/input';
import { FloorTriggerTracker, nearestStatue, stepMotion, WALK_SPEED, type Motion } from '../../castle/movement';
import type { FloorId } from '../../castle/protocol';
import type { CastleSession } from '../../castle/session';
import { fallDrop, type ActiveTransition, type TransitionKind } from '../../castle/transition';
import type { CameraView } from '../../castle/view';
import { glowTexture } from './floors/sceneParts';
import { Oni } from './Oni';

interface PlayerProps {
  session: CastleSession;
  floor: FloorDef;
  statues: PlacedStatue[];
  onTrigger: (to: FloorId, fade: string, effect: TransitionKind) => void;
  onNear: (s: PlacedStatue | null) => void;
  view: CameraView;
  fx: MutableRefObject<ActiveTransition | null>;
  /** 저사양: 달리기 먼지를 끈다 */
  low: boolean;
}

export default function Player({ session, floor, statues, onTrigger, onNear, view, fx, low }: PlayerProps) {
  const ref = useRef<THREE.Group>(null!);
  const shadow = useRef<THREE.Mesh>(null);
  const tracker = useRef(new FloorTriggerTracker());
  const near = useRef<PlacedStatue | null>(null);
  const m = session.motion;
  const area = useMemo(() => walkAreaOf(floor, statues), [floor, statues]);

  useFrame((_, dt) => {
    const moved = stepMotion(m, toWorld(session.input.read(), view === 'first' ? session.look.yaw : 0), area, dt);
    const hit = tracker.current.update(floor, m, moved);
    if (hit) onTrigger(hit.to, hit.fade, hit.effect);

    const best = nearestStatue(statues, m.x, m.z);
    if (best !== near.current) {
      near.current = best;
      onNear(best);
    }

    const drop = fallDrop(fx.current, performance.now());
    ref.current.position.set(m.x, floor.heightAt(m.x, m.z) + drop, m.z);
    ref.current.rotation.y = m.rot;
    if (shadow.current) shadow.current.visible = drop === 0; // 해치로 떨어지는 동안은 그림자 없음
    session.reportMotion();
  });

  return (
    <>
      <group ref={ref}>
        {view === 'third' && (
          <Oni
            hornColor={session.profile.hornColor}
            nickname={session.profile.nickname}
            getSpeed={() => m.speed}
            getBowSeq={() => session.offerSeq}
            isMe
            shadowRef={shadow}
          />
        )}
        {/* 내가 든 작은 등불: 어두운 성에서 주변만 비춘다 */}
        <pointLight position={[0.4, 1.7, 0.6]} color="#ffb870" intensity={9} distance={9} decay={1.5} />
      </group>
      {!low && <RunDust motion={m} floor={floor} />}
    </>
  );
}

// ── 달리기 먼지: 걷기 속도를 넘을 때만 발밑에서 일어난다. 월드 좌표 Points 1개, 다 가라앉으면 숨긴다
const DUST_MAX = 48;
const DUST_LIFE = 0.7; // s
const DUST_RATE = 36; // 개/s
const DUST_COLOR = new THREE.Color('#6e5d4c');

function RunDust({ motion: m, floor }: { motion: Motion; floor: FloorDef }) {
  const state = useMemo(
    () => ({
      pos: new Float32Array(DUST_MAX * 3),
      col: new Float32Array(DUST_MAX * 3),
      vel: new Float32Array(DUST_MAX * 3),
      age: new Float32Array(DUST_MAX).fill(DUST_LIFE),
      next: 0,
      carry: 0,
      alive: 0,
    }),
    [],
  );
  const pts = useRef<THREE.Points>(null!);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = state;
    const running = !m.frozen && m.speed > WALK_SPEED + 0.3;
    if (!running && st.alive === 0) {
      pts.current.visible = false;
      return;
    }
    pts.current.visible = true;
    if (running) {
      st.carry += DUST_RATE * dt;
      const y = floor.heightAt(m.x, m.z);
      for (; st.carry >= 1; st.carry--) {
        const i = st.next;
        st.next = (i + 1) % DUST_MAX;
        // 뒤꿈치 쪽(진행 반대)에서, 옆으로 조금 흩어져 위·뒤로 일어난다
        const back = -0.25;
        const side = (Math.random() - 0.5) * 0.5;
        const sx = Math.sin(m.rot);
        const cz = Math.cos(m.rot);
        st.pos.set([m.x + sx * back + cz * side, y + 0.05, m.z + cz * back - sx * side], i * 3);
        st.vel.set([-sx * 0.6 + (Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.5, -cz * 0.6 + (Math.random() - 0.5) * 0.5], i * 3);
        st.age[i] = 0;
      }
    }
    let alive = 0;
    for (let i = 0; i < DUST_MAX; i++) {
      if (st.age[i] >= DUST_LIFE) {
        st.col.fill(0, i * 3, i * 3 + 3);
        continue;
      }
      alive++;
      st.age[i] += dt;
      const k = Math.max(0, 1 - st.age[i] / DUST_LIFE);
      for (let a = 0; a < 3; a++) st.pos[i * 3 + a] += st.vel[i * 3 + a] * dt;
      st.vel[i * 3 + 1] -= 0.8 * dt; // 천천히 가라앉음
      // 더해지는 빛이라 색을 줄이면 사라진다
      st.col[i * 3] = DUST_COLOR.r * k;
      st.col[i * 3 + 1] = DUST_COLOR.g * k;
      st.col[i * 3 + 2] = DUST_COLOR.b * k;
    }
    st.alive = alive;
    const g = pts.current.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  });
  return (
    <points ref={pts} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[state.col, 3]} />
      </bufferGeometry>
      <pointsMaterial map={glowTexture()} vertexColors size={0.3} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}
