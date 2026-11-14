// 카메라. 3인칭: 뒤쪽 위에서 비스듬히 damping 추적, 드래그로 꾸로를 중심으로 돈다(look.yaw — 이동 방향도 같은 yaw).
// 1인칭: 눈높이에서 LookInput의 yaw·pitch로 본다. 석상 감상: 가까운 석상을 중심으로 돈다(castle/orbit.ts).
// 층 이동 연출(내려감·낙하·흔들림)은 셋 다 받는다. 좁은 층에서는 카메라를 floor.cameraBox 안으로 당긴다.
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import type { LookInput } from '../../castle/input';
import { approach } from '../../castle/interpolation';
import type { Motion } from '../../castle/movement';
import { clampToBox, inspectCenter, inspectEye, rotateXZ, type InspectView, type Vec3 } from '../../castle/orbit';
import { cameraFx, fallDrop, type ActiveTransition } from '../../castle/transition';
import { EYE_HEIGHT, type CameraView } from '../../castle/view';

const FOLLOW_TAU = 0.25;
/** 감상 시점으로 들어가고 나올 때는 조금 더 천천히 */
const INSPECT_TAU = 0.35;
/** 낙하 때 3인칭 카메라 시선이 따라 내려가는 비율 */
const FALL_LOOK = 0.6;

export interface InspectState {
  statue: PlacedStatue;
  view: InspectView;
}

interface FollowCameraProps {
  floor: FloorDef;
  motion: Motion;
  view: CameraView;
  look: LookInput;
  inspect: MutableRefObject<InspectState | null>;
  fx: MutableRefObject<ActiveTransition | null>;
}

export default function FollowCamera({ floor, motion, view, look, inspect, fx }: FollowCameraProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  /** 흔들림·내려감을 빼고 부드럽게 따라가는 위치 */
  const base = useRef(new THREE.Vector3());
  /** 직전 프레임이 1인칭이었으면 3인칭·감상으로 바뀔 때 현재 카메라에서 이어 간다 */
  const wasFirst = useRef(view === 'first');
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const [height, back, lookY] = floor.camera;

  /** 3인칭 눈 위치·시선. yaw 0이면 원래 구도(옆으로 조금 치우친 정면 추적)와 같다 */
  const third = (yaw: number, ground: number, drop: number): { eye: Vec3; at: Vec3 } => {
    const [ex, ez] = rotateXZ(-0.3 * motion.x, back, yaw);
    const [tx, tz] = rotateXZ(-0.15 * motion.x, -4, yaw);
    const player: Vec3 = [motion.x, ground + lookY, motion.z];
    const eye = clampToBox(player, [motion.x + ex, ground + height, motion.z + ez], floor.cameraBox);
    return { eye, at: [motion.x + tx, ground + lookY + drop * FALL_LOOK, motion.z + tz] };
  };

  useEffect(() => {
    if (view === 'first') return;
    const { eye, at } = third(look.yaw, floor.heightAt(motion.x, motion.z), 0);
    base.current.set(...eye);
    camera.position.copy(base.current);
    target.current.set(...at);
    camera.lookAt(target.current);
  }, [floor.id]); // 층이 바뀔 때만 즉시 맞춘다 (시점 전환은 부드럽게 이어 간다)

  useFrame((_, dt) => {
    const now = performance.now();
    const c = cameraFx(fx.current, now);
    const drop = fallDrop(fx.current, now);
    const ground = floor.heightAt(motion.x, motion.z);
    const ins = inspect.current;
    if (view === 'first' && !ins) {
      camera.position.set(motion.x + c.shakeX, ground + drop + EYE_HEIGHT + c.dy + c.shakeY, motion.z);
      camera.rotation.set(look.pitch, look.yaw, 0, 'YXZ');
      wasFirst.current = true;
      return;
    }
    if (wasFirst.current) {
      // 1인칭 → 감상: 눈높이 시점에서 출발해 석상 쪽으로 물러난다
      base.current.copy(camera.position);
      camera.getWorldDirection(tmp);
      target.current.copy(camera.position).addScaledVector(tmp, 4);
      wasFirst.current = false;
    }
    let eye: Vec3;
    let at: Vec3;
    let tau = FOLLOW_TAU;
    if (ins) {
      const center = inspectCenter(ins.statue);
      eye = clampToBox(center, inspectEye(ins.statue, ins.view), floor.cameraBox);
      at = center;
      tau = INSPECT_TAU;
    } else {
      ({ eye, at } = third(look.yaw, ground, drop));
    }
    const k = approach(dt, tau);
    base.current.lerp(tmp.set(...eye), k);
    target.current.lerp(tmp.set(...at), k);
    camera.position.copy(base.current);
    camera.position.y += c.dy;
    camera.lookAt(target.current);
    camera.position.x += c.shakeX;
    camera.position.y += c.shakeY;
  });
  return null;
}
