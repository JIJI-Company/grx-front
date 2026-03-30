/* ════════════════════════════════════
   ✅ 수상 기록 여기에 추가하세요
   category: 'lol' | 'battleground' | 'vr' | 'minecraft' | 'multi'
   medal:    'gold' | 'silver' | 'bronze'
════════════════════════════════════ */
const achievements = [
  {
    category: 'lol',
    medal: 'gold',
    team: 'GRX_LOL',
    achievement: '2026 결망전',
    date: '2026.03.29',
    type: 'LEAGUE OF LEGENDS TEAM',
  },
  {
    category: 'battleground',
    medal: 'silver',
    team: 'GRX_MULTI',
    achievement: '공식 크루 매치 준우승',
    date: '2026.02',
    type: 'MULTI-GAMING TEAM',
  },
  {
    category: 'vr',
    medal: 'bronze',
    team: 'GRX_VR',
    achievement: 'VR 페스티벌 컨텐츠 입상',
    date: '2025.12',
    type: 'VRCHAT & VR TEAM',
  },
  {
    category: 'minecraft',
    medal: 'gold',
    team: 'GRX_MC',
    achievement: '대규모 건축 대회 대상',
    date: '2025.11',
    type: 'MINECRAFT TEAM',
  },
  {
    category: 'multi',
    medal: 'gold',
    team: 'GRX_MLTY',
    achievement: '종합 게임 크루 대항전 우승',
    date: '2025.10',
    type: 'MULTI-GAMING TEAM',
  },
];

const MEDAL_ORDER = { gold: 0, silver: 1, bronze: 2 };
const MEDAL_NUM = { gold: 1, silver: 2, bronze: 3 };
const MEDAL_TEXT = { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' };

function sortedArr(arr) {
  return [...arr].sort((a, b) => MEDAL_ORDER[a.medal] - MEDAL_ORDER[b.medal]);
}

function buildCard(a, delay = 0) {
  return `
  <div class="ach-card ${a.medal}" style="animation-delay:${delay}s">
    <div class="card-topbar"></div>
    <div class="card-body">
      <div class="medal-row">
        <div class="medal-circle">${MEDAL_NUM[a.medal]}</div>
        <div class="medal-info">
          <div class="medal-label">${MEDAL_TEXT[a.medal]}</div>
          <div class="card-date">${a.date}</div>
        </div>
      </div>
      <div class="card-team">${a.team}</div>
      <div class="card-achievement">${a.achievement}</div>
      <div class="card-footer">
        <div class="card-dot"></div>
        <div class="card-type">${a.type}</div>
      </div>
    </div>
  </div>`;
}

function emptyHTML() {
  return `<div class="empty-state"><span class="empty-icon">🏆</span><p>아직 수상 기록이 없습니다</p></div>`;
}

/* 통계 */
function renderStats() {
  const c = { gold: 0, silver: 0, bronze: 0 };
  achievements.forEach((a) => c[a.medal]++);
  document.getElementById('statsInner').innerHTML = `
    <div class="stat-cell"><span class="stat-val gv" id="vG">0</span><span class="stat-lbl">🥇 GOLD</span></div>
    <div class="stat-cell"><span class="stat-val sv" id="vS">0</span><span class="stat-lbl">🥈 SILVER</span></div>
    <div class="stat-cell"><span class="stat-val bv" id="vB">0</span><span class="stat-lbl">🥉 BRONZE</span></div>
    <div class="stat-cell"><span class="stat-val tv" id="vT">0</span><span class="stat-lbl">🏆 TOTAL</span></div>`;
  countUp('vG', c.gold);
  countUp('vS', c.silver);
  countUp('vB', c.bronze);
  countUp('vT', achievements.length);
}

function countUp(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (target === 0) {
    el.textContent = 0;
    return;
  }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 38);
}

/* HOF */
function renderHof() {
  const g = document.getElementById('hofGrid');
  if (!g) return;
  const s = sortedArr(achievements);
  g.innerHTML = s.length
    ? s.map((a, i) => buildCard(a, i * 0.09)).join('')
    : emptyHTML();
}

/* 카테고리 */
function renderCat(cat) {
  const g = document.getElementById('catGrid');
  const b = document.getElementById('catBadges');
  if (!g) return;
  const filtered =
    cat === 'all'
      ? achievements
      : achievements.filter((a) => a.category === cat);
  const s = sortedArr(filtered);
  if (b) {
    const c = { gold: 0, silver: 0, bronze: 0 };
    filtered.forEach((a) => c[a.medal]++);
    const badges = [];
    if (c.gold)
      badges.push(
        `<div class="cat-badge gold"   style="animation-delay:0s">🥇 금메달 ${c.gold}개</div>`,
      );
    if (c.silver)
      badges.push(
        `<div class="cat-badge silver" style="animation-delay:.07s">🥈 은메달 ${c.silver}개</div>`,
      );
    if (c.bronze)
      badges.push(
        `<div class="cat-badge bronze" style="animation-delay:.14s">🥉 동메달 ${c.bronze}개</div>`,
      );
    if (filtered.length)
      badges.push(
        `<div class="cat-badge total" style="animation-delay:.21s">🏆 총 ${filtered.length}개</div>`,
      );
    b.innerHTML = badges.join('');
  }
  g.innerHTML = s.length
    ? s.map((a, i) => buildCard(a, i * 0.09)).join('')
    : emptyHTML();
}

/* 탭 */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCat(btn.dataset.cat);
    });
  });
}

/* NAV */
function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener(
    'scroll',
    () => nav.classList.toggle('scrolled', window.scrollY > 80),
    { passive: true },
  );
}

/* 스크롤 리빌 */
function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderHof();
  renderCat('all');
  initTabs();
  initNav();
  initReveal();
});
