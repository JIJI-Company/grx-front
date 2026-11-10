// 3인칭 쿼터뷰: 뒤쪽 위에서 비스듬히, damping 추적. 방향키 기준이 흔들리지 않게 회전하지 않는다.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorDef } from '../../castle/floors';
import { approach } from '../../castle/interpolation';
import type { Motion } from '../../castle/movement';

const FOLLOW_TAU = 0.25;

export default function FollowCamera({ floor, motion }: { floor: FloorDef; motion: Motion }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const [height, back, lookY] = floor.camera;
  const eye = (out: THREE.Vector3) => out.set(motion.x * 0.7, floor.heightAt(motion.x, motion.z) + height, motion.z + back);

  useEffect(() => {
    eye(camera.position);
    look.current.set(motion.x, lookY, motion.z - 4);
    camera.lookAt(look.current);
  }, [floor.id]); // 층이 바뀔 때만 즉시 맞춘다

  useFrame((_, dt) => {
    const k = approach(dt, FOLLOW_TAU);
    camera.position.lerp(eye(tmp), k);
    look.current.lerp(tmp.set(motion.x * 0.85, floor.heightAt(motion.x, motion.z) + lookY, motion.z - 4), k);
    camera.lookAt(look.current);
  });
  return null;
}
