// 입장 정보(홀·닉네임·뿔 색)를 이 탭에만 기억한다. 새로고침하면 입장 화면을 건너뛰고 바로 다시 들어간다.
// sessionStorage라 탭을 닫으면 사라지고, "성을 나서다"나 입장 거절 때는 직접 지운다.
import type { JoinProfile } from './session';

const KEY = 'castle.entry';

export function loadEntry(): JoinProfile | null {
  try {
    const p: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (!p || typeof p !== 'object') return null;
    const { hall, nickname, hornColor } = p as Record<string, unknown>;
    if (typeof hall !== 'string' || typeof nickname !== 'string' || typeof hornColor !== 'string') return null;
    return { hall, nickname, hornColor };
  } catch {
    return null;
  }
}

export function saveEntry(profile: JoinProfile): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // 저장소를 못 쓰면 새로고침 때 입장 화면부터 다시 시작한다
  }
}

export function clearEntry(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 지울 것이 없다
  }
}
