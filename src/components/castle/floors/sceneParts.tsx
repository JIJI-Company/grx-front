// 층 장면 공용 부품: 결정적 난수, 캔버스 텍스처(창살 창·빛 번짐), 인스턴싱(발광 상자·반복 부품), 떠다니는 입자
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** 결정적 난수 (새로고침해도 같은 배치) */
export function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** 창살 창문 텍스처 (따뜻한 종이창) */
export function useWindowTexture(repeatY = 1) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#140904';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#ffb04a';
    for (const [x, y] of [[6, 6], [34, 6], [6, 34], [34, 34]]) g.fillRect(x, y, 24, 24);
    g.fillStyle = '#5a2a10';
    for (let i = 0; i < 4; i++) {
      g.fillRect(6 + 8 * i, 6, 1, 52);
      g.fillRect(6, 6 + 8 * i, 52, 1);
      g.fillRect(34 + 8 * i, 6, 1, 52);
      g.fillRect(6, 34 + 8 * i, 52, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, repeatY);
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [repeatY]);
}

let glow: THREE.CanvasTexture | null = null;
/** 가운데가 밝고 가장자리로 사라지는 원형 빛 (바닥 빛 번짐 데칼). 한 장을 모두 같이 쓴다 */
export function glowTexture(): THREE.CanvasTexture {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  return glow;
}

/** 캔버스에 그려서 반복 텍스처로 (텍스처 파일 없이) */
export function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void, repeat: [number, number] = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

export type Vec3 = [number, number, number];
/** 반복 부품 하나의 자리. s는 지오메트리 배율, c는 인스턴스 색(재질 색에 곱해짐) */
export type Placement = { p: Vec3; r?: Vec3; s?: Vec3; c?: string };

/** 같은 지오메트리·재질 반복 부품: InstancedMesh 1개 = draw call 1개. 지오메트리·재질은 이 컴포넌트가 정리한다 */
export function Instanced({ geometry, material, items }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Placement[] }) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geometry, material, items.length);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(...(it.r ?? [0, 0, 0]));
      o.scale.set(...(it.s ?? [1, 1, 1]));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (it.c) m.setColorAt(i, col.set(it.c));
    });
    m.frustumCulled = false;
    return m;
  }, [geometry, material, items]);
  useEffect(() => () => void (mesh.dispose(), geometry.dispose(), material.dispose()), [mesh, geometry, material]);
  return <primitive object={mesh} />;
}

export type Box = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; b: number };

/** 발광 상자 필드: InstancedMesh 1개 = draw call 1개 */
export function BoxField({ boxes, repeatY = 1, dim = 1 }: { boxes: Box[]; repeatY?: number; dim?: number }) {
  const tex = useWindowTexture(repeatY);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: tex }), boxes.length);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    boxes.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.rotation.set(0, b.ry, 0);
      o.scale.set(b.sx, b.sy, b.sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.setScalar(b.b * dim));
    });
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [boxes, tex, dim]);
  return <primitive object={mesh} />;
}

export function scatter(n: number, seed: number, area: (r: () => number) => Omit<Box, 'b' | 'ry'> | null, flat = false): Box[] {
  const r = rng(seed);
  const out: Box[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 10) {
    const b = area(r);
    if (!b) continue;
    out.push({ ...b, ry: flat ? 0 : (Math.floor(r() * 4) * Math.PI) / 2, b: 0.25 + r() * r() * 1.1 });
  }
  return out;
}

/** 떠오르는 입자(불씨·먼지). bounds = [x0, x1, y0, y1, z0, z1] */
export function Embers({
  count,
  seed,
  bounds,
  color,
  size,
  rise,
  opacity = 0.9,
  altColor,
}: {
  count: number;
  seed: number;
  bounds: [number, number, number, number, number, number];
  color: string;
  size: number;
  rise: number;
  opacity?: number;
  /** 있으면 입자 셋 중 하나를 이 색으로 (불티 사이 먼지 등). 여전히 Points 1개 */
  altColor?: string;
}) {
  const [x0, x1, y0, y1, z0, z1] = bounds;
  const positions = useMemo(() => {
    const r = rng(seed);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) pos.set([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), z0 + r() * (z1 - z0)], i * 3);
    return pos;
  }, [count, seed, x0, x1, y0, y1, z0, z1]);
  const colors = useMemo(() => {
    if (!altColor) return null;
    const a = new THREE.Color(color);
    const b = new THREE.Color(altColor);
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) (i % 3 === 0 ? b : a).toArray(out, i * 3);
    return out;
  }, [count, color, altColor]);
  const pts = useRef<THREE.Points>(null!);
  useFrame(({ clock }, dt) => {
    const a = pts.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) + dt * rise * (1 + (i % 7) * 0.3);
      if (y > y1) y = y0;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(t * 0.7 + i) * dt * 0.15);
    }
    a.needsUpdate = true;
  });
  return (
    <points ref={pts} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        {colors && <bufferAttribute attach="attributes-color" args={[colors, 3]} />}
      </bufferGeometry>
      <pointsMaterial
        color={colors ? '#ffffff' : color}
        vertexColors={!!colors}
        size={size}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
