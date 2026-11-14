// 방향키·WASD·조이스틱 → 이동 의도(화면 기준: ↑ = 앞). 월드 방향은 toWorld로 카메라 yaw만큼 돌린다.
// 3인칭은 카메라가 -z를 바라보고 회전하지 않으므로 yaw 0 → ↑ = -z 그대로.
export interface MoveAxis {
  /** 크기 0~1. 대각선은 정규화된다 */
  x: number;
  z: number;
  run: boolean;
}

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const RUN = ['ShiftLeft', 'ShiftRight'];
const SWALLOW = new Set([...LEFT, ...RIGHT, ...UP, ...DOWN, 'Space']);
/** 조이스틱을 이만큼 밀면 달리기 */
const JOYSTICK_RUN = 0.9;

export class MoveInput {
  private keys = new Set<string>();
  private stick = { x: 0, z: 0 };

  /** window에 키 리스너를 단다. 반환값으로 해제 */
  attach(target: Window = window): () => void {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (SWALLOW.has(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const blur = () => this.keys.clear();
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', blur);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', blur);
      this.keys.clear();
    };
  }

  /** 조이스틱 화면 좌표 기준 오프셋(-1~1). y는 아래가 + */
  setJoystick(x: number, y: number): void {
    this.stick.x = x;
    this.stick.z = y;
  }

  read(): MoveAxis {
    const held = (codes: string[]) => codes.some((c) => this.keys.has(c));
    const kx = (held(RIGHT) ? 1 : 0) - (held(LEFT) ? 1 : 0);
    const kz = (held(DOWN) ? 1 : 0) - (held(UP) ? 1 : 0);
    if (kx || kz) {
      const len = Math.hypot(kx, kz);
      return { x: kx / len, z: kz / len, run: held(RUN) };
    }
    const mag = Math.min(Math.hypot(this.stick.x, this.stick.z), 1);
    if (mag < 0.12) return { x: 0, z: 0, run: false };
    const len = Math.hypot(this.stick.x, this.stick.z);
    return { x: (this.stick.x / len) * mag, z: (this.stick.z / len) * mag, run: mag >= JOYSTICK_RUN };
  }
}

/** 화면 기준 이동 의도 → 월드 방향. yaw = 카메라 y축 회전(0이면 -z를 본다) */
export function toWorld(axis: MoveAxis, yaw: number): MoveAxis {
  if (yaw === 0) return axis;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: axis.x * c + axis.z * s, z: -axis.x * s + axis.z * c, run: axis.run };
}

/** 마우스(포인터 락) 픽셀당 회전(rad) */
export const MOUSE_SENSITIVITY = 0.0022;
/** 모바일 드래그 픽셀당 회전(rad) */
export const TOUCH_SENSITIVITY = 0.005;
const PITCH_LIMIT = 1.2;

/** 1인칭 시점 회전. 화면이 매 프레임 읽는다 */
export class LookInput {
  yaw = 0;
  pitch = 0;

  /** 화면 이동량(px) → 회전. 오른쪽으로 끌면 오른쪽을 본다 */
  turn(dx: number, dy: number, sensitivity: number): void {
    this.yaw -= dx * sensitivity;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch - dy * sensitivity));
  }

  reset(): void {
    this.yaw = 0;
    this.pitch = 0;
  }
}
