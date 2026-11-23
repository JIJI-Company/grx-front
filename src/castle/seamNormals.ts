// 석상 GLB 법선: UV 이음새에서 끊기지 않게 계산한다.
// 텍스처를 붙이려고 메시를 조각(UV)으로 펼치면 조각 경계의 정점이 복제된다. computeVertexNormals는 정점 번호 단위로
// 평균하므로 복제된 정점끼리는 서로를 모르고, 경계 양쪽 법선이 달라져 조명에서 밝기가 뚝 끊긴다(얼굴의 네모난 음영).
// 여기서는 같은 위치의 정점을 하나로 보고 면 법선(면적 가중)을 합친 뒤 복제된 정점들에 똑같이 나눠 준다.
import * as THREE from 'three';

/** 위치를 이 크기 격자로 반올림해 같은 정점으로 본다 (모델 좌표, 내보낸 GLB의 부동소수 오차보다 크고 정점 간격보다 작게) */
const WELD = 1e-5;

export function seamlessNormals(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const n = pos.count;
  const keyOf = (i: number) =>
    `${Math.round(pos.getX(i) / WELD)},${Math.round(pos.getY(i) / WELD)},${Math.round(pos.getZ(i) / WELD)}`;
  const group = new Int32Array(n);
  const ids = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const k = keyOf(i);
    let g = ids.get(k);
    if (g === undefined) {
      g = ids.size;
      ids.set(k, g);
    }
    group[i] = g;
  }
  const acc = new Float32Array(ids.size * 3);
  const index = geometry.getIndex();
  const tris = index ? index.count / 3 : n / 3;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < tris; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1).sub(a);
    c.fromBufferAttribute(pos, i2).sub(a);
    b.cross(c); // 길이 = 면적 × 2 → 면적 가중
    for (const i of [i0, i1, i2]) {
      const g = group[i] * 3;
      acc[g] += b.x;
      acc[g + 1] += b.y;
      acc[g + 2] += b.z;
    }
  }
  const normals = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const g = group[i] * 3;
    const len = Math.hypot(acc[g], acc[g + 1], acc[g + 2]) || 1;
    normals[i * 3] = acc[g] / len;
    normals[i * 3 + 1] = acc[g + 1] / len;
    normals[i * 3 + 2] = acc[g + 2] / len;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
}
