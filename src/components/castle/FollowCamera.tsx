// 카메라. 3인칭: 뒤쪽 위에서 비스듬히 damping 추적, 방향키 기준이 흔들리지 않게 회전하지 않는다.
// 1인칭: 눈높이에서 LookInput의 yaw·pitch로 본다. 층 이동 연출(내려감·낙하·흔들림)은 둘 다 받는다.
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorDef } from '../../castle/floors';
import type { LookInput } from '../../castle/input';
import { approach } from '../../castle/interpolation';
import type { Motion } from '../../castle/movement';
import { cameraFx, fallDrop, type ActiveTransition } from '../../castle/transition';
import { EYE_HEIGHT, type CameraView } from '../../castle/view';

const FOLLOW_TAU = 0.25;
/** 낙하 때 3인칭 카메라 시선이 따라 내려가는 비율 */
const FALL_LOOK = 0.6;

interface FollowCameraProps {
  floor: FloorDef;
  motion: Motion;
  view: CameraView;
  look: LookInput;
  fx: MutableRefObject<ActiveTransition | null>;
}

export default function FollowCamera({ floor, motion, view, look, fx }: FollowCameraProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  /** 흔들림·내려감을 빼고 부드럽게 따라가는 3인칭 위치 */
  const base = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const [height, back, lookY] = floor.camera;
  const eye = (out: THREE.Vector3) => out.set(motion.x * 0.7, floor.heightAt(motion.x, motion.z) + height, motion.z + back);

  useEffect(() => {
    if (view === 'first') return;
    eye(base.current);
    camera.position.copy(base.current);
    target.current.set(motion.x, lookY, motion.z - 4);
    camera.lookAt(target.current);
  }, [floor.id, view]); // 층·시점이 바뀔 때만 즉시 맞춘다

  useFrame((_, dt) => {
    const now = performance.now();
    const c = cameraFx(fx.current, now);
    const drop = fallDrop(fx.current, now);
    const ground = floor.heightAt(motion.x, motion.z);
    if (view === 'first') {
      camera.position.set(motion.x + c.shakeX, ground + drop + EYE_HEIGHT + c.dy + c.shakeY, motion.z);
      camera.rotation.set(look.pitch, look.yaw, 0, 'YXZ');
      return;
    }
    const k = approach(dt, FOLLOW_TAU);
    base.current.lerp(eye(tmp), k);
    target.current.lerp(tmp.set(motion.x * 0.85, ground + lookY + drop * FALL_LOOK, motion.z - 4), k);
    camera.position.copy(base.current);
    camera.position.y += c.dy;
    camera.lookAt(target.current);
    camera.position.x += c.shakeX;
    camera.position.y += c.shakeY;
  });
  return null;
}
