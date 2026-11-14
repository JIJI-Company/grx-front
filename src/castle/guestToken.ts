// 익명 게스트 토큰 (security.md): 32바이트 무작위 → base64url(패딩 없음) 43자.
// localStorage 'castle.guestToken'에 두고, 접근이 막히면 이 탭 메모리에만 둔다. 핸드셰이크 auth로만 보낸다.
const KEY = 'castle.guestToken';
const FORMAT = /^[A-Za-z0-9_-]{43}$/;
let memoryToken: string | null = null;

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getGuestToken(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && FORMAT.test(saved)) return saved;
    const token = randomToken();
    localStorage.setItem(KEY, token);
    return token;
  } catch {
    memoryToken ??= randomToken();
    return memoryToken;
  }
}
