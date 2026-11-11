// 등롱 바치기 연출 하나: (내 것이면) 머리 위에서 석상 발치로 날아가는 등롱 → 바닥 파동, 단계가 오르면 빛기둥.
// 곡선·타이밍은 castle/offering.ts. 끝나면 그룹을 숨겨 draw call도 프레임 연산도 남기지 않는다.
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorDef, PlacedStatue } from '../../castle/floors';
import { flightPose, OFFER_FX_MS, pillar, ripple, type OfferEvent, type Vec3 } from '../../castle/offering';
import { canvasTexture } from './floors/sceneParts';
import { PAPER_GLOW, useLanternGeometry } from './LanternRing';

/** 바친 사람 머리 위 높이(m) */
const HEAD = 1.9;
/** 등롱이 내려앉는 자리: 석상 앞 첫 줄 가운데 (LanternRing 첫 줄 반지름) */
const LAND_RADIUS = 1.0;
const PILLAR_RADIUS = 0.4;

let fade: THREE.CanvasTexture | null = null;
/** 아래는 진하고 위로 사라지는 세로 그라데이션 (빛기둥). 한 장을 같이 쓴다 */
function pillarFade(): THREE.CanvasTexture {
  if (fade) return fade;
  fade = canvasTexture(64, (g, n) => {
    const grad = g.createLinearGradient(0, 0, 0, n);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, n, n);
  });
  return fade;
}

/** 날아가는 등롱: 발치 등롱과 같은 lantern.glb 지오메트리 */
function FlyingLantern({ event, statue, floor }: { event: OfferEvent; statue: PlacedStatue; floor: FloorDef }) {
  const geo = useLanternGeometry();
  const mats = useMemo(
    () => ({
      // 종이를 멤버 색으로 물들여 톤 매핑 뒤에도 흰색이 아니라 멤버 색으로 보이게
      paper: new THREE.MeshStandardMaterial({ color: statue.color, roughness: 0.9, emissive: new THREE.Color(statue.color), emissiveIntensity: PAPER_GLOW }),
      frame: new THREE.MeshStandardMaterial({ color: '#120c0a', roughness: 0.55 }),
    }),
    [statue.color],
  );
  useEffect(() => () => void (mats.paper.dispose(), mats.frame.dispose()), [mats]);
  const path = useMemo(() => {
    const s = statue;
    const to: Vec3 = [s.x + Math.sin(s.rotY) * LAND_RADIUS * s.scale, s.lift, s.z + Math.cos(s.rotY) * LAND_RADIUS * s.scale];
    const fx = event.from?.x ?? s.x;
    const fz = event.from?.z ?? s.z;
    // 1인칭에서 카메라와 겹치지 않게 석상 쪽으로 조금 앞에서 떠오른다
    const d = Math.hypot(to[0] - fx, to[2] - fz) || 1;
    const from: Vec3 = [fx + ((to[0] - fx) / d) * 0.5, floor.heightAt(fx, fz) + HEAD, fz + ((to[2] - fz) / d) * 0.5];
    return { from, to };
  }, [event, statue, floor]);
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    const pose = flightPose(event, performance.now(), path.from, path.to);
    ref.current.visible = !!pose;
    if (!pose) return;
    ref.current.position.set(...pose.p);
    ref.current.scale.setScalar(1 + (statue.scale - 1) * pose.k);
    ref.current.rotation.y = statue.rotY + pose.k * Math.PI;
    mats.paper.emissiveIntensity = PAPER_GLOW * pose.glow;
  });
  if (!geo.paper || !geo.frame) return null;
  return (
    <group ref={ref} visible={false}>
      <mesh geometry={geo.paper} material={mats.paper} />
      <mesh geometry={geo.frame} material={mats.frame} />
    </group>
  );
}

export default function OfferFx({ event, statue, floor }: { event: OfferEvent; statue: PlacedStatue; floor: FloorDef }) {
  const mats = useMemo(() => {
    const glow = (extra: THREE.MeshBasicMaterialParameters = {}) =>
      new THREE.MeshBasicMaterial({ color: statue.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, ...extra });
    return { ring: glow(), pillar: glow({ map: pillarFade() }) };
  }, [statue.color]);
  const geo = useMemo(
    () => ({
      ring: new THREE.RingGeometry(0.9, 1, 96).rotateX(-Math.PI / 2),
      pillar: new THREE.CylinderGeometry(1, 1, 1, 32, 1, true).translate(0, 0.5, 0),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(geo).forEach((g) => g.dispose());
    },
    [mats, geo],
  );
  const root = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const pillarRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!root.current.visible) return;
    const now = performance.now();
    if (now - event.start > OFFER_FX_MS) {
      root.current.visible = false;
      return;
    }
    const sc = statue.scale;
    const r = ripple(event, now);
    ringRef.current.visible = !!r;
    if (r) {
      ringRef.current.scale.setScalar(r.radius * sc);
      mats.ring.opacity = r.opacity;
    }
    const p = pillar(event, now);
    pillarRef.current.visible = !!p;
    if (p) {
      pillarRef.current.scale.set(PILLAR_RADIUS * sc, Math.max(p.height * sc, 0.01), PILLAR_RADIUS * sc);
      mats.pillar.opacity = p.opacity;
    }
  });
  return (
    <group ref={root}>
      {/* 바닥(y 0)에 깐다: 떠 있는 석상도 파동은 바닥에서 */}
      <group position={[statue.x, 0, statue.z]}>
        <mesh ref={ringRef} geometry={geo.ring} material={mats.ring} position={[0, 0.05, 0]} visible={false} renderOrder={2} />
        <mesh ref={pillarRef} geometry={geo.pillar} material={mats.pillar} visible={false} renderOrder={2} />
      </group>
      {event.kind === 'mine' && (
        <Suspense fallback={null}>
          <FlyingLantern event={event} statue={statue} floor={floor} />
        </Suspense>
      )}
    </group>
  );
}
