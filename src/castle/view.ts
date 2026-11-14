// 1인칭/3인칭 선택. 서버와 무관한 내 화면 설정이라 localStorage에만 둔다.
export type CameraView = 'first' | 'third';

const KEY = 'castle.view';
/** 1인칭 눈높이(m). 꾸로 키 ≈ 1.5m */
export const EYE_HEIGHT = 1.3;

export function loadView(): CameraView {
  try {
    return localStorage.getItem(KEY) === 'first' ? 'first' : 'third';
  } catch {
    return 'third';
  }
}

export function saveView(view: CameraView): void {
  try {
    localStorage.setItem(KEY, view);
  } catch {
    // 저장소를 못 쓰면(사생활 보호 모드 등) 이번 입장 동안만 유지
  }
}
