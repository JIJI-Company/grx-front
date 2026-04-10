// 🔴 실시간 멤버 데이터 변수
let liveMembers = [];

// ── 라이브 대시보드 카드 생성 ──
function buildDashboardCard(m) {
  const status = String(m.status || '').toLowerCase();
  const isLive = status === 'on-air' || status === 'live';
  
  // 썸네일: SOOP API에서 받은 실시간 썸네일 → 없으면 기본 이미지
  let thumbnail = (m.thumbnail && m.thumbnail !== '') ? m.thumbnail : 'img/ggu_title.jpg';
  // 브라우저 캐시 방지: 현재 시간 추가
  if (thumbnail.includes('liveimg.sooplive.co.kr')) {
      thumbnail += `?t=${Date.now()}`;
  }
  
  return `
    <div class="live-card-v2 ${m.status}" onclick="window.open('${m.link}', '_blank')">
      <!-- 썸네일 영역 -->
      <div class="card-thumbnail-wrap">
        <div class="card-live-badge">${isLive ? 'ON AIR' : 'OFFLINE'}</div>
        <img src="${thumbnail}" alt="Thumbnail">
        <!-- 아바타 오버랩 -->
        <div class="card-avatar-wrap">
          <img src="${m.profileImg}" alt="${m.name}">
        </div>
      </div>

      <!-- 카드 바디 -->
      <div class="card-body-v2">
        <div class="card-streamer-name">${m.name}</div>
        <h3 class="card-stream-title">${m.streamTitle || (isLive ? '방송 명을 불러오는 중...' : '현재 방송 중이지 않습니다.')}</h3>
        
        <div class="card-action-v2">
          <span class="btn-visit-soop">VISIT CHANNEL →</span>
        </div>
      </div>
    </div>
  `;
}

// ── 대시보드 렌더링 ──
function renderLiveDashboard() {
  const grid = document.getElementById('liveDashboardGrid');
  if (!grid) return;
  
  // [on-air 필터링] 방송 중인 멤버만 추출
  const currentLive = liveMembers.filter(m => m.status === 'on-air');

  if (currentLive.length === 0) {
    grid.innerHTML = `
      <div class="empty-live-state" style="grid-column: 1 / -1; text-align: center; padding: 100px 20px;">
        <div style="font-size: 4rem; opacity: 0.2; margin-bottom: 20px;">🌙</div>
        <p style="color: #666; letter-spacing: 0.2rem;">현재 방송 중인 멤버가 없습니다.</p>
        <p style="color: #444; font-size: 0.8rem; margin-top: 10px;">멤버들의 방송 일정표를 확인해 보세요.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = currentLive.map(m => buildDashboardCard(m)).join('');
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', async () => {
  // SWR 전략: 데이터 서비스 연결
  liveMembers = await DataService.getData('live', (updatedData) => {
    liveMembers = updatedData || [];
    renderLiveDashboard();
  }) || [];

  renderLiveDashboard();

  // 기존 일정표 렌더링 기능 유지 (필요 시)
  const scheduleGrid = document.getElementById('scheduleGrid');
  if (scheduleGrid && typeof renderSchedules === 'function') {
    renderSchedules();
  }
});

