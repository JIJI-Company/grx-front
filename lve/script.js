// 🔴 실시간 멤버 데이터 변수
let liveMembers = [];

// ── 라이브 대시보드 카드 생성 ──
function buildDashboardCard(m) {
  const status = String(m.status || '').toLowerCase();
  const isLive = (status === 'on-air' || status === 'live');
  
  // 아바타 아이콘 처리 (시트의 profileImg 우선 사용)
  let profileImg = m.profileImg || '';
  if (!profileImg || profileImg === '') {
    // 백업: 이름 기반 매칭 (확장자 고려)
    const name = m.name || m.id;
    if (name === '다무' || name === 'damu') profileImg = 'img/damu.jpeg';
    else if (name === '딴딴' || name === 'ttanttan') profileImg = 'img/ttanttan.jpeg';
    else profileImg = `img/${m.id || name}.png`;
  }
  // 경로 보정: 만약 img/ 가 안붙어있다면 붙여줌
  if (profileImg && !profileImg.startsWith('http') && !profileImg.startsWith('img/') && !profileImg.startsWith('./img/')) {
    profileImg = `img/${profileImg}`;
  }
  
  // 썸네일 결정 logic: 방송중이면 실시간 화면, 아니면 멤버 사진, 그것도 없으면 타이틀
  let thumbnail = (m.thumbnail && m.thumbnail !== '') ? m.thumbnail : profileImg;
  if (!thumbnail || thumbnail === '') thumbnail = 'img/ggu_title.jpg';
  
  // 브라우저 캐시 방지: 실시간 썸네일일 때만 추가
  if (thumbnail.includes('liveimg.sooplive.co.kr')) {
      thumbnail += `?t=${Date.now()}`;
  }
  
  return `
    <div class="live-card-v2 ${status}" onclick="window.open('${m.link}', '_blank')">
      <!-- 썸네일 영역 -->
      <div class="card-thumbnail-wrap">
        <div class="card-live-badge">${isLive ? 'ON AIR' : 'OFFLINE'}</div>
        <img src="${thumbnail}" alt="Thumbnail" class="main-thumb" onerror="this.src='img/ggu_title.jpg'">
        <!-- 아바타 오버랩 -->
        <div class="card-avatar-wrap">
          <img src="${profileImg}" alt="${m.name}" onerror="this.src='img/ggu_title.jpg'">
        </div>
      </div>

      <!-- 카드 바디 -->
      <div class="card-body-v2">
        <div class="card-streamer-name">${m.name}</div>
        <h3 class="card-stream-title">${m.streamTitle || (isLive ? '방송 데이터를 불러오는 중...' : '현재 휴식 중입니다.')}</h3>
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

  // 📡 [실시간 온에어 엠비언트 펄스 & 호버 글리치 연출]
  document.querySelectorAll('.live-card-v2').forEach(card => {
    // 1. 온에어 카드의 실시간 네온 펄스 효과
    if (card.classList.contains('on-air') || card.classList.contains('live')) {
      gsap.fromTo(card,
        { boxShadow: "0 15px 35px rgba(0,0,0,0.5), 0 0 8px rgba(255,26,74,0.15)", borderColor: "rgba(255, 26, 74, 0.15)" },
        { 
          boxShadow: "0 15px 35px rgba(0,0,0,0.5), 0 0 25px rgba(255,26,74,0.45)", 
          borderColor: "rgba(255, 26, 74, 0.55)",
          duration: 2.0, 
          repeat: -1, 
          yoyo: true, 
          ease: "sine.inOut" 
        }
      );
    }

    // 2. 호버 시 신호 주입 느낌의 글리치 지터링 연출
    card.addEventListener('mouseenter', () => {
      const tl = gsap.timeline();
      tl.to(card, { scaleX: 1.02, scaleY: 0.98, opacity: 0.88, duration: 0.04, ease: "power1.inOut" })
        .to(card, { scaleX: 0.98, scaleY: 1.02, opacity: 1, duration: 0.04 })
        .to(card, { scaleX: 1, scaleY: 1, duration: 0.08 });
    });
  });
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', async () => {
  // 공통 프리미엄 인터랙션 구동
  initCommonInteractions();

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

// =========================================
// 🪐 [프리미엄 GSAP 공통 인터랙션 패키지]
// =========================================
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }
}

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 15);
      const end = start + Math.floor(Math.random() * 15);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span style="color: #e11d48; opacity: 0.7;">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

function initCommonInteractions() {
  initSmoothScroll();

  // 메뉴 호버 스크램블
  document.querySelectorAll('.nav-links a').forEach(link => {
    const originalText = link.innerText;
    const fx = new TextScramble(link);
    let isScrambling = false;
    
    link.addEventListener('mouseenter', () => {
      if (isScrambling) return;
      isScrambling = true;
      fx.setText(originalText).then(() => {
        isScrambling = false;
      });
    });
  });

  // 헤더 타이틀 디코딩 등장 연출
  const glowTitle = document.querySelector('.glow-title, .hero-title, .archive-title, .sch-title-main');
  if (glowTitle) {
    const orig = glowTitle.innerText;
    const fx = new TextScramble(glowTitle);
    gsap.set(glowTitle, { opacity: 1 });
    setTimeout(() => {
      fx.setText(orig);
    }, 400);
  }
}

