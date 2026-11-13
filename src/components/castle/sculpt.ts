// 조각 재질: Paint 텍스처에서 색을 버리고 밝기만 남겨 (1) 회색 돌 위 명암 (2) 표면 높낮이(bump)로 쓴다.
// 머리카락·눈동자처럼 어두운 곳은 어둡고 파인 듯, 피부처럼 밝은 곳은 밝고 도드라진 듯 보여 이목구비가 구분된다.
// 진짜로 깎은 형태가 아니라 밝기로 흉내 낸 것이라 실루엣은 그대로다. 단독 뷰어(assets/castle/statues/viewer)와 같은 계산.
import * as THREE from 'three';

/** 'paint' = Paint 텍스처 그대로(기본), 'sculpt' = 조각 재질. VITE_STATUE_FINISH로 고른다 */
export const STATUE_FINISH: 'paint' | 'sculpt' = import.meta.env.VITE_STATUE_FINISH === 'sculpt' ? 'sculpt' : 'paint';

const SCULPT_STONE = '#6d6669';
/** 회색 맵의 평균을 이 값(sRGB 0~255)에 맞춘다. 선형으로 약 0.5 → SCULPT_LIFT를 곱하면 맨 돌과 같은 밝기가 된다.
 *  그래서 텍스처 없는 조각 머리(plainStone)와 명암이 들어간 몸의 돌 색이 따로 놀지 않는다 */
const GRAY_CENTER = 185;
const SCULPT_LIFT = 2;
/** 밝기 차이를 평균 기준으로 이만큼 키운다 */
const SCULPT_CONTRAST = 1.2;
/** 새김 깊이 (three.js bumpScale) */
const SCULPT_BUMP = 3;

/** 같은 원본 텍스처는 한 번만 회색으로 만든다 (석상 여러 개·재마운트) */
const grayCache = new WeakMap<THREE.Texture, THREE.Texture>();

function grayTexture(src: THREE.Texture): THREE.Texture | null {
  const cached = grayCache.get(src);
  if (cached) return cached;
  const img = src.image as CanvasImageSource & { width: number; height: number };
  if (!img?.width) return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  const mean = sum / (px.length / 4);
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = px[i + 1] = px[i + 2] = Math.max(0, Math.min(255, GRAY_CENTER + (l - mean) * SCULPT_CONTRAST));
  }
  ctx.putImageData(data, 0, 0);
  const gray = new THREE.CanvasTexture(canvas);
  gray.flipY = src.flipY;
  gray.colorSpace = THREE.SRGBColorSpace;
  gray.wrapS = src.wrapS;
  gray.wrapT = src.wrapT;
  grayCache.set(src, gray);
  return gray;
}

/** 조각 재질. 원본 텍스처를 못 읽으면 null (호출한 쪽이 일반 텍스처 재질을 쓴다) */
export function sculptMaterial(map: THREE.Texture, emissive: THREE.Color): THREE.MeshStandardMaterial | null {
  const gray = grayTexture(map);
  if (!gray) return null;
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(SCULPT_STONE).multiplyScalar(SCULPT_LIFT),
    map: gray,
    bumpMap: gray,
    bumpScale: SCULPT_BUMP,
    roughness: 0.9,
    emissive,
  });
}

/** 텍스처 없는 메시(조각 머리)용 맨 돌. 멤버 색 물들이기 없이 조각 몸과 같은 회색 */
export function plainStone(emissive: THREE.Color): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: SCULPT_STONE, roughness: 0.9, emissive });
}
