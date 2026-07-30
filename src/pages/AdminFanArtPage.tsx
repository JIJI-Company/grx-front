import { useCallback, useEffect, useState } from 'react';
import { apiGetFanArtPending, apiApproveFanArt, apiRejectFanArt } from '../api/client';
import type { FanArtItem } from '../api/types';
import FanArtLightbox from '../components/fanart/FanArtLightbox';

const STORAGE_KEY = 'fanart-admin-key';

export default function AdminFanArtPage() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? '');
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<FanArtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<FanArtItem | null>(null);

  const load = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetFanArtPending(key);
      setItems(data);
      setAuthed(true);
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch {
      setError('인증 실패 또는 서버 오류');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) load(adminKey);
  }, [adminKey, load]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setAdminKey(input.trim());
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await apiApproveFanArt(id, adminKey);
      else await apiRejectFanArt(id, adminKey);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('처리 실패');
    }
  };

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <h2 style={styles.loginTitle}>팬아트 관리자</h2>
          <input
            type="password"
            placeholder="관리자 키 입력"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.loginBtn}>로그인</button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>팬아트 승인 대기 ({items.length})</h2>
      {loading && <p>로딩 중...</p>}
      {!loading && items.length === 0 && <p style={styles.empty}>대기 중인 팬아트가 없습니다</p>}
      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <button
              type="button"
              aria-label={`${item.title} 원본 이미지 보기`}
              onClick={() => setSelected(item)}
              style={styles.previewButton}
            >
              <img src={item.thumbUrl} alt={item.title} style={styles.img} />
            </button>
            <div style={styles.info}>
              <strong>{item.title}</strong>
              <span style={styles.meta}>
                {item.authorName} · {item.members.map((m) => m.stageName).join(', ')}
              </span>
              <span style={styles.meta}>
                {new Date(item.createdAt).toLocaleDateString('ko-KR')} · {Math.round(item.fileSize / 1024)}KB
              </span>
            </div>
            <div style={styles.actions}>
              <button onClick={() => handleAction(item.id, 'approve')} style={styles.approveBtn}>승인</button>
              <button onClick={() => handleAction(item.id, 'reject')} style={styles.rejectBtn}>거절</button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <FanArtLightbox art={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: 12, width: 300 },
  loginTitle: { margin: 0, fontSize: 20, color: '#fff' },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: 14 },
  loginBtn: { padding: '10px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#ef4444', margin: 0, fontSize: 13 },
  wrap: { maxWidth: 800, margin: '0 auto', padding: '40px 20px' },
  title: { color: '#fff', marginBottom: 24 },
  empty: { color: '#888' },
  grid: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { display: 'flex', gap: 16, background: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center' },
  previewButton: { display: 'block', flexShrink: 0, padding: 0, border: 'none', borderRadius: 8, background: 'none', cursor: 'zoom-in' },
  img: { width: 120, height: 90, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, color: '#fff', fontSize: 14 },
  meta: { color: '#888', fontSize: 12 },
  actions: { display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 },
  approveBtn: { padding: '8px 20px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  rejectBtn: { padding: '8px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};
