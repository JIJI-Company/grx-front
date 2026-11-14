// 재배치 연출의 장지문 방들: 카메라에 붙어 움직이는 창 텍스처 상자 InstancedMesh 1개 (draw call 1개).
// 배치·움직임은 shiftPresentation.ts가 정하고, 여기서는 매 프레임 받은 자세를 그린다.
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActiveTransition } from '../../castle/transition';
import { useWindowTexture } from './floors/sceneParts';
import { shiftRoomCapacity, shiftRoomPose, shiftRooms, type ShiftRoom } from './shiftPresentation';

export default function ShiftRooms({ fx, low }: { fx: MutableRefObject<ActiveTransition | null>; low: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const tex = useWindowTexture();
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: tex, fog: false }), shiftRoomCapacity(low));
    m.frustumCulled = false;
    m.visible = false;
    return m;
  }, [tex, low]);
  useEffect(() => () => void (mesh.dispose(), mesh.geometry.dispose(), (mesh.material as THREE.Material).dispose()), [mesh]);
  /** 이번 연출(out 시작 시각)의 방들. in에서도 같은 방을 쓴다 */
  const plan = useRef<{ start: number; rooms: ShiftRoom[] } | null>(null);
  const o = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const t = fx.current;
    if (!t || t.kind !== 'shift') {
      mesh.visible = false;
      plan.current = null;
      return;
    }
    if (!plan.current || (t.phase === 'out' && plan.current.start !== t.start)) {
      const rooms = shiftRooms(t, { fov: camera.fov, aspect: camera.aspect }, low);
      const col = new THREE.Color();
      rooms.forEach((r, i) => mesh.setColorAt(i, col.setScalar(r.b)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.count = rooms.length;
      plan.current = { start: t.start, rooms };
    }
    const ms = performance.now() - t.start;
    plan.current.rooms.forEach((room, i) => {
      const pose = shiftRoomPose(room, t.phase, ms, t.span);
      o.position.set(...(pose?.p ?? [0, 0, 0]));
      o.rotation.set(...(pose?.r ?? [0, 0, 0]));
      o.scale.set(...(pose?.s ?? [0, 0, 0]));
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // 카메라는 제자리: 방들을 카메라 자리·방향에 붙인다
    mesh.position.copy(camera.position);
    mesh.quaternion.copy(camera.quaternion);
    mesh.visible = true;
  });
  return <primitive object={mesh} />;
}
