// 새 공간(광장·전당 등) 공용 부품: 글씨 현판, 기와지붕, 종이등, 트로피. 텍스처 파일 없이 캔버스·도형으로만 만든다.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { glowTexture } from '../floors/sceneParts';

export type Vec3 = [number, number, number];

/** 글씨 한 줄을 그린 텍스처 (현판·명판). 배경은 투명 */
function textTexture(text: string, color: string, w: number, h: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = h * 0.62;
  g.font = `700 ${size}px "Noto Serif KR", "Apple SD Gothic Neo", serif`;
  const fit = (w * 0.9) / g.measureText(text).width;
  if (fit < 1) {
    size *= fit;
    g.font = `700 ${size}px "Noto Serif KR", "Apple SD Gothic Neo", serif`;
  }
  g.fillText(text, w / 2, h / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** 글씨만 떠 있는 면. glow > 1이면 블룸에 잡힌다 */
export function Label({ text, width, height, color = '#f3d27a', glow = 1, position, rotation }: { text: string; width: number; height: number; color?: string; glow?: number; position?: Vec3; rotation?: Vec3 }) {
  const tex = useMemo(() => textTexture(text, '#ffffff', 512, Math.max(64, Math.round((512 * height) / width))), [text, width, height]);
  const tint = useMemo(() => new THREE.Color(color).multiplyScalar(glow), [color, glow]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} color={tint} transparent depthWrite={false} />
    </mesh>
  );
}

/** 현판: 검은 옻칠 판 + 금 테두리 + 글씨. 앞 = +z */
export function Signboard({ text, width = 4, height = 1.1, position, rotation, color = '#f3d27a' }: { text: string; width?: number; height?: number; position?: Vec3; rotation?: Vec3; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width + 0.24, height + 0.24, 0.1]} />
        <meshStandardMaterial color="#b8860b" emissive="#d4a020" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color="#120b0c" roughness={0.35} />
      </mesh>
      <Label text={text} width={width * 0.9} height={height * 0.8} color={color} glow={1.6} position={[0, 0, 0.1]} />
    </group>
  );
}

const ROOF_GEOMETRY = new Map<number, THREE.BufferGeometry>();
/** 네 면이 기운 지붕 몸통 (밑변 1x1, 높이 1). top = 윗면 한 변의 비율 */
function roofGeometry(top: number): THREE.BufferGeometry {
  let geo = ROOF_GEOMETRY.get(top);
  if (!geo) {
    geo = new THREE.CylinderGeometry(top / Math.SQRT2, 1 / Math.SQRT2, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0);
    ROOF_GEOMETRY.set(top, geo);
  }
  return geo;
}

/** 기와지붕: 처마 판 + 기운 몸통 + 용마루 + 살짝 들린 네 귀. 원점 = 처마 밑면 가운데, w·d = 벽 크기(처마는 overhang만큼 더 나온다) */
export function TileRoof({ w, d, h, overhang = 1.3, position, color = '#191317', trim = '#b8860b' }: { w: number; d: number; h: number; overhang?: number; position?: Vec3; color?: string; trim?: string }) {
  const W = w + overhang * 2;
  const D = d + overhang * 2;
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[W, 0.2, D]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 처마 끝 금빛 띠 */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[W + 0.06, 0.07, D + 0.06]} />
        <meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.35} roughness={0.5} />
      </mesh>
      <mesh geometry={roofGeometry(0.42)} position={[0, 0.2, 0]} scale={[W * 0.96, h, D * 0.96]}>
        <meshStandardMaterial color={color} roughness={0.75} flatShading />
      </mesh>
      {/* 용마루 */}
      <mesh position={[0, h + 0.32, 0]}>
        <boxGeometry args={[W * 0.42, 0.28, 0.42]} />
        <meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      {/* 들린 네 귀 */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * W) / 2, 0.32, (sz * D) / 2]} rotation={[sz * -0.5, 0, sx * 0.5]}>
            <boxGeometry args={[0.9, 0.14, 0.9]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** 종이등: 빛나는 몸통 + 위아래 검은 테. 광원은 없다(블룸과 바닥 빛 번짐으로만 밝다) */
export function PaperLantern({ position, color = '#ffb060', size = 1, glow = 2.2 }: { position?: Vec3; color?: string; size?: number; glow?: number }) {
  const paper = useMemo(() => new THREE.Color(color).multiplyScalar(glow), [color, glow]);
  return (
    <group position={position} scale={size}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 12]} />
        <meshBasicMaterial color={paper} />
      </mesh>
      {[-0.27, 0.27].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 12]} />
          <meshStandardMaterial color="#151012" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** 바닥에 깔리는 둥근 빛 번짐 */
export function GlowPool({ position, size, color, opacity = 0.5 }: { position: Vec3; size: number; color: string; opacity?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

const CUP_PROFILE = [
  [0.0, 0.0], [0.24, 0.0], [0.24, 0.07], [0.11, 0.11], [0.05, 0.2], [0.05, 0.36], [0.1, 0.43], [0.2, 0.58], [0.25, 0.8], [0.27, 0.86],
].map(([r, y]) => new THREE.Vector2(r, y));
const CUP_GEOMETRY = new THREE.LatheGeometry(CUP_PROFILE, 20);
const MEDAL = {
  gold: { color: '#d9a520', emissive: '#c8860a' },
  silver: { color: '#c9ced6', emissive: '#6f7a8a' },
  bronze: { color: '#b0703a', emissive: '#7a4010' },
} as const;
export type Medal = keyof typeof MEDAL;

/** 트로피: 컵 + 손잡이 둘. 금·은·동 세 가지만 (특정 대회 트로피를 본뜨지 않는다). 높이 ≈ 0.86 * scale */
export function Trophy({ medal, position, scale = 1 }: { medal: Medal; position?: Vec3; scale?: number }) {
  const m = MEDAL[medal];
  return (
    <group position={position} scale={scale}>
      <mesh geometry={CUP_GEOMETRY}>
        <meshStandardMaterial color={m.color} emissive={m.emissive} emissiveIntensity={0.55} metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.27, 0.66, 0]} rotation={[0, 0, s * -0.2]}>
          <torusGeometry args={[0.1, 0.022, 8, 16, Math.PI * 1.2]} />
          <meshStandardMaterial color={m.color} emissive={m.emissive} emissiveIntensity={0.55} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
