// Content 화랑 배치 로직 (순수 함수). 화면은 받은 좌표에 그리기만 한다.
// 화랑은 가운데 칸막이로 통로가 둘이다: 왼쪽 벽 · 칸막이 왼쪽 면 · 칸막이 오른쪽 면 · 오른쪽 벽, 네 면에 포스터를 건다.
// 한 바퀴 도는 길을 따라 시간순(예전 → 최신)으로 건다: 왼쪽 통로로 들어가며(왼쪽 벽·칸막이 번갈아)
// 안쪽에서 돌아 오른쪽 통로로 나오며(칸막이·오른쪽 벽 번갈아). 가장 최근 것은 나오는 길 끝, 입구 옆이다.
// 포스터가 늘면 줄이 늘어 안쪽(-z)으로 길어진다.
import type { ContentsArchiveItem } from '../../../api/types';

/** 줄 간격(m)과 첫 줄 z */
export const COLUMN_GAP = 2.2;
export const FIRST_COLUMN_Z = 1;
/** 벽·칸막이 면의 x */
export const WALL_X = 5.4;
export const SPINE_HALF = 0.42;
/** 포스터를 보는 자리: 면에서 통로 쪽으로 이만큼 */
const VIEW_OFFSET = 1.6;

export interface PlacedPoster {
  item: ContentsArchiveItem;
  /** 포스터 면 가운데 */
  x: number;
  z: number;
  /** 포스터가 바라보는 방향(y축 회전) */
  rotY: number;
  /** 포스터 앞 관람 자리 (가까이 갔는지 판정) */
  viewX: number;
}

const FACES = [
  { x: -WALL_X, rotY: Math.PI / 2, toward: 1 }, // 왼쪽 벽 → 오른쪽(+x)을 본다
  { x: -SPINE_HALF, rotY: -Math.PI / 2, toward: -1 }, // 칸막이 왼쪽 면
  { x: SPINE_HALF, rotY: Math.PI / 2, toward: 1 }, // 칸막이 오른쪽 면
  { x: WALL_X, rotY: -Math.PI / 2, toward: -1 }, // 오른쪽 벽
] as const;

/** 한 바퀴 도는 길의 자리 순서: [면, 줄]. 왼쪽 통로는 안으로(줄 0 → 끝), 오른쪽 통로는 밖으로(줄 끝 → 0) */
function loopSlots(columns: number): [number, number][] {
  const inward = Array.from({ length: columns }, (_, c) => c).flatMap((c): [number, number][] => [[0, c], [1, c]]);
  const outward = Array.from({ length: columns }, (_, k) => columns - 1 - k).flatMap((c): [number, number][] => [[2, c], [3, c]]);
  return [...inward, ...outward];
}

/** 예전 것부터 한 바퀴 도는 길을 따라 건다 */
export function placePosters(items: ContentsArchiveItem[]): PlacedPoster[] {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'ko'));
  const slots = loopSlots(Math.ceil(sorted.length / 4));
  return sorted.map((item, i) => {
    const [f, c] = slots[i];
    const face = FACES[f];
    return { item, x: face.x, z: FIRST_COLUMN_Z - c * COLUMN_GAP, rotY: face.rotY, viewX: face.x + face.toward * VIEW_OFFSET };
  });
}

/** 마지막 줄 z (칸막이가 여기까지) */
export function lastColumnZ(count: number): number {
  return FIRST_COLUMN_Z - Math.max(0, Math.ceil(count / 4) - 1) * COLUMN_GAP;
}

/** 맨 안쪽 벽 z: 마지막 줄 뒤로 두 통로가 이어지는 공간을 둔다 */
export function galleryEndZ(count: number): number {
  return lastColumnZ(count) - 4;
}

/** (x, z)에서 radius 안의 가장 가까운 포스터 */
export function nearestPoster(posters: PlacedPoster[], x: number, z: number, radius: number): PlacedPoster | null {
  let best: PlacedPoster | null = null;
  let bestD = radius;
  for (const p of posters) {
    const d = Math.hypot(p.viewX - x, p.z - z);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

/** "2026.11.11" */
export function posterDate(iso: string): string {
  return iso ? iso.slice(0, 10).replace(/-/g, '.') : '';
}
