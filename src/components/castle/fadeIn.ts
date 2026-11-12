// 그룹 전체를 서서히 나타나게 하기: 불투명 재질을 잠깐 투명 재질로 바꿔 opacity를 올리고, 다 나타나면 되돌린다.
import * as THREE from 'three';

/** 그룹 안의 불투명 재질 (이미 투명한 재질은 각자 opacity를 따로 다루므로 뺀다) */
export function opaqueMaterials(root: THREE.Object3D): THREE.Material[] {
  const found = new Set<THREE.Material>();
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    for (const mat of Array.isArray(m) ? m : m ? [m] : []) if (!mat.transparent) found.add(mat);
  });
  return [...found];
}

/** opacity 1이면 원래의 불투명 재질로 되돌린다 */
export function setFade(mats: readonly THREE.Material[], opacity: number): void {
  const transparent = opacity < 1;
  for (const m of mats) {
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.opacity = opacity;
  }
}
