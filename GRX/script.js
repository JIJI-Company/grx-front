// ── 전역 데이터 변수 ──
let achievements = [];

// ── 상수 ──
const MEDAL_ORDER = { gold: 0, silver: 1, bronze: 2 };
const MEDAL_NUM = { gold: 1, silver: 2, bronze: 3 };
const MEDAL_TEXT = { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' };

// ── 카드 HTML 생성 (기본 구조) ──
function buildCard(a, delay = 0) {
  return `
    <div class="team-card ${a.medal}" style="animation-delay:${delay}s">
        <div class="card-medal-label">${MEDAL_TEXT[a.medal] || 'ACHIEVEMENT'}</div>
        <div class="card-team-name">${a.team}</div>
        <div class="card-medal-icon">${MEDAL_NUM[a.medal] || '🏆'}</div>
        <div class="card-achievement">${a.achievement}</div>
        <div class="card-divider"></div>
        <div class="card-date">${a.date}</div>
        <div class="card-type">${a.type}</div>
    </div>
  `;
}

function sortByMedal(arr) {
  return [...arr].sort((a, b) => (MEDAL_ORDER[a.medal] ?? 99) - (MEDAL_ORDER[b.medal] ?? 99));
}

function emptyHTML() {
  return `
    <div class="empty-state">
      <span class="empty-icon">🏆</span>
      <p>기록을 불러오는 중이거나 아직 수상 기록이 없습니다</p>
    </div>
  `;
}

// ── 전체 통계 렌더 ──
function renderTotalStats() {
  const el = document.getElementById('totalStats');
  if (!el) return;

  const c = { gold: 0, silver: 0, bronze: 0 };
  achievements.forEach((a) => {
    if (c[a.medal] !== undefined) c[a.medal]++;
  });

  el.innerHTML = `
    <div class="stat-item">
      <span class="stat-num gold-c"   id="sGold">0</span>
      <span class="stat-label">🥇 GOLD</span>
    </div>
    <div class="stat-item">
      <span class="stat-num silver-c" id="sSilver">0</span>
      <span class="stat-label">🥈 SILVER</span>
    </div>
    <div class="stat-item">
      <span class="stat-num bronze-c" id="sBronze">0</span>
      <span class="stat-label">🥉 BRONZE</span>
    </div>
    <div class="stat-item">
      <span class="stat-num white-c"  id="sTotal">0</span>
      <span class="stat-label">🏆 TOTAL</span>
    </div>
  `;

  countUp('sGold', c.gold);
  countUp('sSilver', c.silver);
  countUp('sBronze', c.bronze);
  countUp('sTotal', achievements.length);
}

// 숫자 카운트업
function countUp(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) {
    if (el) el.textContent = 0;
    return;
  }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 28));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 40);
}

// ── HOF 슬라이더 렌더 ──
function renderHofSlider() {
  const track = document.getElementById('hof-slider');
  if (!track) return;
  const sorted = sortByMedal(achievements);
  track.innerHTML = sorted.length
    ? sorted.map((a, i) => buildCard(a, i * 0.08)).join('')
    : emptyHTML();
}

// ── 카테고리 슬라이더 렌더 ──
function renderCatSlider(cat) {
  const track = document.getElementById('cat-slider');
  const statsEl = document.getElementById('catStats');
  if (!track) return;

  const filtered =
    cat === 'all'
      ? achievements
      : achievements.filter((a) => a.category === cat);
  const sorted = sortByMedal(filtered);

  if (statsEl) {
    const c = { gold: 0, silver: 0, bronze: 0 };
    filtered.forEach((a) => {
      if (c[a.medal] !== undefined) c[a.medal]++;
    });
    const badges = [];
    if (c.gold)
      badges.push(
        `<div class="cat-badge gold"   style="animation-delay:0s">   🥇 금메달 ${c.gold}개</div>`,
      );
    if (c.silver)
      badges.push(
        `<div class="cat-badge silver" style="animation-delay:0.08s">🥈 은메달 ${c.silver}개</div>`,
      );
    if (c.bronze)
      badges.push(
        `<div class="cat-badge bronze" style="animation-delay:0.16s">🥉 동메달 ${c.bronze}개</div>`,
      );
    if (filtered.length > 0)
      badges.push(
        `<div class="cat-badge total"  style="animation-delay:0.24s">🏆 총 ${filtered.length}개</div>`,
      );
    statsEl.innerHTML = badges.join('');
  }

  track.innerHTML = sorted.length
    ? sorted.map((a, i) => buildCard(a, i * 0.08)).join('')
    : emptyHTML();
}

// ── 슬라이더 화살표 ──
function slideCards(trackId, dir) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.scrollLeft += dir * 310;
}
window.slideCards = slideCards;

// ── 탭 초기화 ──
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCatSlider(btn.dataset.cat);
    });
  });
}

// ── NAV 스크롤 효과 ──
function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY > 60) {
        nav.style.background = 'rgba(5, 0, 2, 0.7)';
        nav.style.borderBottom = '1px solid rgba(255, 26, 74, 0.3)';
        nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
      } else {
        nav.style.background = 'rgba(5, 0, 2, 0.5)';
        nav.style.borderBottom = '1px solid rgba(255, 26, 74, 0.15)';
        nav.style.boxShadow = 'none';
      }
    },
    { passive: true },
  );
}

// ── 스크롤 인 애니메이션 ──
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll('.hof-section, .cat-section').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
  });
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', async () => {
  // 공통 프리미엄 인터랙션 구동
  initCommonInteractions();

  achievements = await DataService.getData('history', (updatedData) => {
    achievements = updatedData || [];
    renderTotalStats();
    renderHofSlider();
    renderCatSlider(document.querySelector('.tab-btn.active')?.dataset.cat || 'all');
  }) || [];

  renderTotalStats();
  renderHofSlider();
  renderCatSlider('all');
  initTabs();
  initNav();
  initScrollReveal();

  // 드래그 관성 슬라이더 개시
  initDragSlider('hof-slider');
  initDragSlider('cat-slider');
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

// ── 🏆 드래그 관성(Momentum) 슬라이더 물리 연산 엔진 ──
function initDragSlider(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let velocity = 0;
  let lastX = 0;
  let lastTime = 0;
  let rafId = null;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    velocity = 0;
    lastX = e.pageX;
    lastTime = Date.now();
    cancelAnimationFrame(rafId);
  });

  track.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    track.style.cursor = 'grab';
    applyInertia();
  });

  track.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    track.style.cursor = 'grab';
    applyInertia();
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.6; // 드래그 가중 감도
    track.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      const dx = e.pageX - lastX;
      velocity = dx / dt;
    }
    lastX = e.pageX;
    lastTime = now;
  });

  // 모바일 터치 지원
  track.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    velocity = 0;
    lastX = e.touches[0].pageX;
    lastTime = Date.now();
    cancelAnimationFrame(rafId);
  });

  track.addEventListener('touchend', () => {
    if (!isDown) return;
    isDown = false;
    applyInertia();
  });

  track.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - track.offsetLeft;
    const walk = (x - startX) * 1.6;
    track.scrollLeft = scrollLeft - walk;

    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      const dx = e.touches[0].pageX - lastX;
      velocity = dx / dt;
    }
    lastX = e.touches[0].pageX;
    lastTime = now;
  });

  function applyInertia() {
    if (Math.abs(velocity) < 0.05) return;
    track.scrollLeft -= velocity * 16;
    velocity *= 0.94; // 94% 마찰 감쇠
    rafId = requestAnimationFrame(applyInertia);
  }

  // 초기 커서 스타일 설정
  track.style.cursor = 'grab';
}
