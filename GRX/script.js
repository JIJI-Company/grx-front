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
});
