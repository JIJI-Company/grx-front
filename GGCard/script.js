// 1. 모든 멤버 데이터 통합 관리
const members = {
  master: [
    {
      id: 'gguu',
      name: '꾸티뉴',
      rank: 'MASTER',
      img: 'img/ggutinho.png',
      art: '무한 연산',
      desc: '지-캐슬의 마스터.',
      keywords: '#지마스터 #무한성주인',
      birthday: '12.25',
      mbti: 'INTJ',
      tmi: '무한성을 총괄하며 모든 혈귀들을 관리합니다.',
      color: '#cc0033',
      link: 'https://www.sooplive.com/station/aksen7833',
    },
  ],
  upper: [
    {
      id: 'yamuza',
      name: '야무지',
      sub: '상현의 1',
      rank: '상현 1',
      img: 'img/yamuzi.png',
      art: '달의 호흡',
      desc: '상현 1위의 검사.',
      keywords: '#수면괴물 #1등딸래미',
      birthday: '01.14',
      mbti: 'INTP',
      tmi: 'OTT, 잠, 맛있는 음식 좋아함 (콩 싫어함)',
      color: '#FF0000',
      link: 'https://www.sooplive.com/station/land4968',
    },
    {
      id: 'enju',
      name: '엔쥬',
      sub: '상현의 2',
      rank: '상현 2',
      img: 'img/enju.png',
      art: '빙결 혈귀술',
      desc: '빙결의 수호자.',
      keywords: '#북극여우 #GOAT',
      birthday: '09.17',
      mbti: 'ISFP',
      tmi: '베이킹 고수, 연유라떼 러버,(염소 아님)',
      color: '#FFFFFF',
      link: 'https://www.sooplive.com/station/northpole',
    },
    {
      id: 'lika',
      name: '리카',
      sub: '상현의 5',
      rank: '상현 5',
      img: 'img/lika.png',
      art: '항아리 소환',
      desc: '항아리 술사.',
      keywords: '#아프리카딸 #크앙단',
      birthday: '07.14',
      mbti: 'ESFJ',
      tmi: '연프&애니 광팬, 야채와 벌레 혐오',
      color: '#F2D27A',
      link: 'https://www.sooplive.com/station/lika07',
    },
  ],
  lower: [
    {
      id: 'nanana',
      name: '난워니',
      rank: 'LOWER 2',
      img: 'img/nanana.png',
      art: '하현 2',
      desc: '하현의 2위.',
      keywords: '#기린 #워냥이',
      birthday: '03.25',
      mbti: 'ESFP',
      tmi: '면 요리 킬러, 배그&마크 좋아함',
      color: '#FFFF00',
      link: 'https://www.sooplive.com/station/whiteone325',
    },
    {
      id: 'damu',
      name: '다뮤',
      rank: 'LOWER 4',
      img: 'img/damu.jpeg',
      art: '하현 4',
      desc: '하현의 4위.',
      keywords: '#워터밤 #삼샴뮤',
      birthday: '04.14',
      mbti: 'ESFP',
      tmi: '롤 비틱질과 멤버 놀리기가 주특기',
      color: '#2E5A88',
      link: 'https://www.sooplive.com/station/not15987',
    },
    {
      id: 'ttanttan',
      name: '딴딴2당',
      rank: 'LOWER 5',
      img: 'img/ttanttan.jpeg',
      art: ' 명사수',
      desc: ' 으에',
      keywords: '#오독이 #말랑이',
      birthday: '07.08',
      mbti: 'INFP',
      tmi: '칭찬에 약하고 도움이 되고 싶은 에겐',
      color: '#FFB6C1',
      link: 'https://www.sooplive.com/station/dbsk0708',
    },
    {
      id: 'baamya',
      name: '바먀',
      rank: 'LOWER 6',
      img: 'img/baamya.png',
      art: '바먀',
      desc: '.',
      keywords: '#씨앗아가씨 #바밤바',
      birthday: '11.02',
      mbti: 'INFP',
      tmi: '미스테리&분탕 취미, 공겜 쥐약',
      color: '#8B4513',
      link: 'https://www.sooplive.com/station/wooyah21',
    },
    {
      id: 'seora0',
      name: '서라0',
      rank: 'LOWER',
      img: 'img/서라0.jpg',
      art: '눈꽃의 호흡',
      desc: '훈병서라공이라 불리는 신입 혈귀.',
      keywords: '#훈병서라공 #울보공 #공단이',
      birthday: '08.23',
      mbti: 'ISFJ',
      tmi: '방송과 별풍선, 바다를 좋아하는 처녀자리 울보공',
      color: '#4FC3F7',
      link: 'https://www.sooplive.com/station/o0opha',
    },
  ],
  new: [
    {
      id: 'mint',
      name: '임민트',
      rank: 'NEW',
      img: 'img/mint.png',
      art: '양치의 호흡',
      desc: '반올림하면 2m인 배그 요정.',
      keywords: '#엄디 #임팔라 #임맹슈',
      birthday: '06.16',
      mbti: '????',
      tmi: '키 2m를 주장하는 장신, 주력은 배그와 라디오',
      color: '#00C9A7',
      link: 'https://www.sooplive.com/station/mint616',
    },
    {
      id: 'okdok',
      name: '김옥독',
      rank: 'NEW',
      img: 'img/okdok.png',
      art: '순간이동술',
      desc: '옥독해옥독해',
      keywords: '#옥독해 #표오독 #옥살이',
      birthday: '02.20',
      mbti: 'ENTJ',
      tmi: '해산물과 소주를 즐기며 연애프로그램을 싫어함',
      color: '#9CD5C2',
      link: 'https://www.sooplive.com/station/niniru',
    },
    {
      id: 'nyangsso',
      name: '냥쏘',
      rank: 'NEW',
      img: 'img/nangsso.png',
      art: '분홍 혈귀술',
      desc: '해산물과 매운맛에 진심인 핑크빛 게임 고수.',
      keywords: '#냥빵 #ENFJ #모몽가 #게임광인',
      birthday: '12.06',
      mbti: 'ENFJ',
      tmi: '방송-씻기-잠의 무한 굴레에 빠진 스트리밍 중독자, 미나리와 공겜을 극도로 혐오함.',
      color: '#FFB6C1',
      link: 'https://www.sooplive.com/station/leesoi34',
    },
    {
      id: 'yuntami',
      name: '윤타미',
      rank: 'NEW',
      img: 'img/tami.png',
      art: '윤타미의 호흡',
      desc: '지-캐슬의 신입 혈귀.',
      keywords: '#윤타미 #타미 #신입',
      birthday: '??',
      mbti: '??',
      tmi: '상세 정보 업데이트 예정입니다.',
      color: '#87CEEB',
      link: 'https://www.sooplive.com/station/dbsthdus111',
    },
    {
      id: 'bomsai',
      name: '봄세이',
      rank: 'NEW',
      img: 'img/BOMSAI.png',
      art: '봉인의 호흡',
      desc: '신입 혈귀 봄셍;입니다. 수수께끼의 자물쇠를 지니고 있습니다.',
      keywords: '#봄세이 #안경 #자물쇠',
      birthday: '??',
      mbti: '??',
      tmi: '안경 위의 자물쇠에 대한 비밀은 아직 밝혀지지 않았습니다.',
      color: '#5DADE2',
      link: 'https://www.sooplive.com/station/bomsai',
    },
    {
      id: 'moya',
      name: '모야',
      rank: 'NEW',
      img: 'img/moya.png',
      art: '모야의 호흡',
      desc: '신입 혈귀.',
      keywords: '#모야 #신입',
      birthday: '??',
      mbti: '??',
      tmi: '상세 정보 업데이트 예정입니다.',
      color: '#fce17e',
      link: 'https://www.sooplive.com/station/neul0908',
    },{
      id: 'sosimhae',
      name: '소심해',
      rank: 'NEW',
      img: 'img/sosim.jpeg',
      art: '소심해',
      desc: '신입 혈귀.',
      keywords: '#소심해 #신입',
      birthday: '??',
      mbti: '??',
      tmi: '상세 정보 업데이트 예정입니다.',
      color: '#EADDE2',
      link: 'https://www.sooplive.com/station/thtlago0607',
    },
    
  ],
};

// HEX to RGB 변환 헬퍼 (그라데이션용)
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 26, 74';
}

// 2. 카드 생성 함수
function createCard(member, isGold = false) {
  const memberColor = member.color || '#ff1a4a';
  const memberRgb = hexToRgb(memberColor);

  // 어두운 멤버 색상 감지 (카드 뒷면 가독성 보장)
  const hex = memberColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const isDarkColor = lum < 80;
  
  const keywordsColor = isDarkColor ? '#e8c4c9' : member.color;
  const hintColor = isDarkColor ? '#ff8fa0' : member.color;
  const hintBorderColor = isDarkColor ? 'rgba(255,143,160,0.5)' : member.color;

  return `
        <div class="flip-card" style="--member-color: ${memberColor}; --member-color-rgb: ${memberRgb};">
            <div class="flip-front">
                <div class="portrait">
                    <img src="${member.img}" alt="${member.name}">
                    <div class="rank-overlay ${isGold ? 'gold' : ''}">${member.rank}</div>
                </div>
                <div class="info">
                    <h3 class="${isGold ? 'gold-text' : ''}" style="color: ${memberColor}">${member.name}</h3>
                    <span class="blood-art" style="background: linear-gradient(90deg, ${memberColor}, #fff); -webkit-background-clip: text; background-clip: text;">${member.art}</span>
                </div>
            </div>
            <div class="flip-back">
                <h3 class="gold-text">${member.name}</h3>
                <div class="back-keywords" style="color: ${keywordsColor}; font-size: 0.75rem; margin: 10px 0;">${member.keywords}</div>
                <p style="font-size:0.8rem; color:#aaa; line-height: 1.4;">${member.desc}</p>
                <span class="click-hint" style="margin-top: 15px; font-size: 0.65rem; color: ${hintColor}; border: 1px solid ${hintBorderColor}; padding: 4px 8px; border-radius: 4px;">CLICK FOR RECORD</span>
            </div>
        </div>
    `;
}

// 3. 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 공통 프리미엄 인터랙션 구동
  initCommonInteractions();

  // 마스터 렌더링
  const masterContainer = document.querySelector(
    '.master-container .flip-container',
  );
  if (masterContainer) {
    masterContainer.innerHTML = createCard(members.master[0], true);
    masterContainer.onclick = () => openMemberModal(members.master[0]);
  }

  // 상현 렌더링
  const upperGrid = document.getElementById('upper-grid');
  if (upperGrid) {
    members.upper.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'flip-container';
      div.innerHTML = createCard(m);
      div.onclick = () => openMemberModal(m);
      upperGrid.appendChild(div);
    });
  }

  // 하현 렌더링
  const lowerGrid = document.getElementById('lower-grid');
  if (lowerGrid) {
    members.lower.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'flip-container';
      div.innerHTML = createCard(m);
      div.onclick = () => openMemberModal(m);
      lowerGrid.appendChild(div);
    });
  }

  // NEW 렌더링
  const newGrid = document.getElementById('new-grid');
  if (newGrid) {
    members.new.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'flip-container';
      div.innerHTML = createCard(m);
      div.onclick = () => openMemberModal(m);
      newGrid.appendChild(div);
    });
  }

  // 마인드맵 뷰 초기화
  initMindmapView();
});

// 4. 모달 기능
function openMemberModal(data) {
  const view = document.getElementById('modal-detail-view');
  const overlay = document.getElementById('memberModal');
  if (!data) return;

  // 멤버 컬러 활용한 스타일
  const accentColor = data.color || '#ff1a4a';
  
  // 밝기 계산 (Luminance) - 어두운 색상도 정확히 감지
  const getLuminance = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const luminance = getLuminance(accentColor);
  const isLight = luminance > 180;
  const isDark = luminance < 80; // ✅ 어두운 색상 감지
  
  // 뱃지 텍스트 색상: 너무 어두우면 밝은 색으로 대체
  const badgeTextColor = isDark ? '#e8c4c9' : accentColor;
  const badgeBorderColor = isDark ? 'rgba(255, 180, 190, 0.3)' : `${accentColor}55`;
  const rankGlowColor = isDark ? '#ff6b7a' : accentColor;

  const btnStyle = isLight 
    ? `background: #ffffff; color: #111; border: 2px solid ${accentColor}; box-shadow: 0 0 15px ${accentColor}66;`
    : `background: ${isDark ? '#ff1a4a' : accentColor}; color: #fff; border: none; box-shadow: 0 8px 15px ${isDark ? 'rgba(255,26,74,0.4)' : accentColor + '44'};`;

  view.innerHTML = `
        <div class="modal-left">
            <img src="${data.img}" alt="${data.name}">
        </div>
        <div class="modal-right">
            <div class="modal-rank" style="color: ${rankGlowColor}">${data.rank}</div>
            <h2 style="text-shadow: 0 0 30px ${rankGlowColor}80">${data.name}</h2>
            <div class="modal-keywords">${data.keywords}</div>
            <div class="modal-divider"></div>
            
            <div class="modal-meta">
                <span class="meta-badge" style="border-color: ${badgeBorderColor}; color: ${badgeTextColor}">${data.birthday}</span>
                <span class="meta-badge" style="border-color: ${badgeBorderColor}; color: ${badgeTextColor}">${data.mbti}</span>
            </div>
            
            <p class="modal-desc" style="color: #aaa;">
                <b style="color:#ddd; font-size:0.8rem; letter-spacing:0.1rem; text-transform:uppercase;">혈귀술</b><br>
                <span style="color:#fff; font-size:0.95rem;">${data.art}</span><br><br>
                ${data.desc}
            </p>

            <div class="modal-tmi" style="border-left-color: ${accentColor}; background: linear-gradient(to right, ${accentColor}11, transparent);">
                <span class="tmi-title" style="color: ${accentColor}">TMI / 특이사항</span>
                <p class="tmi-content">${data.tmi}</p>
            </div>

            <button class="btn-visit" style="${btnStyle}" onclick="window.open('${data.link}')">SOOP STATION</button>
        </div>
    `;

  overlay.style.display = 'flex';
  overlay.classList.add('active');
  
  // 🪐 3D 공간감 확장 GSAP 오프닝 시퀀스
  gsap.killTweensOf([overlay, ".modal-left img", ".modal-right > *", "#modal-detail-view"]);
  
  // 백드롭 페이드인
  gsap.fromTo(overlay, 
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: "power2.out" }
  );

  // 정보판 3D 팝업
  gsap.fromTo("#modal-detail-view",
    { scale: 0.9, rotateX: 10, y: 50, opacity: 0 },
    { scale: 1, rotateX: 0, y: 0, opacity: 1, duration: 0.65, ease: "back.out(1.1)", perspective: 1200 }
  );

  // 아바타 3D 슬라이드 인
  gsap.fromTo(".modal-left img",
    { scale: 0.85, rotateY: -20, opacity: 0 },
    { scale: 1, rotateY: 0, opacity: 1, duration: 0.7, delay: 0.1, ease: "power3.out" }
  );

  // 상세 텍스트 요소들 시간차 등장 (Stagger)
  gsap.fromTo(".modal-right > *",
    { x: 35, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.55, stagger: 0.05, delay: 0.15, ease: "power2.out" }
  );
}

function closeMemberModal() {
  const overlay = document.getElementById('memberModal');
  
  // 🪐 3D 수축 페이드아웃 클로징 시퀀스
  gsap.to("#modal-detail-view", {
    scale: 0.92,
    rotateX: -10,
    y: 30,
    opacity: 0,
    duration: 0.35,
    ease: "power2.in"
  });

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.35,
    ease: "power2.in",
    onComplete: () => {
      overlay.style.display = 'none';
      overlay.classList.remove('active');
    }
  });
}
// 배경 클릭 시 닫기
window.onclick = (e) => {
  if (e.target == document.getElementById('memberModal')) closeMemberModal();
};

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

// 🪐 5. [무한성 마인드맵 캔버스 엔진]
function initMindmapView() {
  const gridViewBtn = document.getElementById('grid-view-btn');
  const mindmapViewBtn = document.getElementById('mindmap-view-btn');
  const traditionalView = document.getElementById('traditional-grids-view');
  const mindmapView = document.getElementById('mindmap-canvas-container');
  const canvas = document.getElementById('mindmap-canvas');
  const nodesLayer = document.getElementById('mindmap-nodes-layer');
  const svg = document.getElementById('mindmap-svg');

  if (!gridViewBtn || !mindmapViewBtn || !traditionalView || !mindmapView) return;

  let mindmapInitialized = false;

  // 드래그 & 줌 렌더러 변수
  let isDragging = false;
  let startX, startY;
  let currentX = -750; // 가상 캔버스 디폴트 X
  let currentY = -500; // 가상 캔버스 디폴트 Y
  let scale = 0.8;      // 기본 뷰 스케일

  function updateTransform() {
    canvas.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
  }

  // 1. 마우스 휠 줌 휠 핸들러
  mindmapView.addEventListener('wheel', (e) => {
    if (mindmapView.style.display === 'none') return;
    e.preventDefault();
    const zoomFactor = 0.05;
    if (e.deltaY < 0) {
      scale = Math.min(1.8, scale + zoomFactor);
    } else {
      scale = Math.max(0.35, scale - zoomFactor);
    }
    updateTransform();
  }, { passive: false });

  // 2. 드래그/이동 마우스 제어
  mindmapView.addEventListener('mousedown', (e) => {
    if (e.target.closest('.mindmap-node')) return; // 노드 클릭 시 드래그 방지
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    mindmapView.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    mindmapView.style.cursor = 'grab';
  });

  // 3. 모바일 터치 스와이프 제어
  mindmapView.addEventListener('touchstart', (e) => {
    if (e.target.closest('.mindmap-node')) return;
    isDragging = true;
    startX = e.touches[0].clientX - currentX;
    startY = e.touches[0].clientY - currentY;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX - startX;
    currentY = e.touches[0].clientY - startY;
    updateTransform();
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // 4. 뷰 모드 토글 바인딩
  gridViewBtn.addEventListener('click', () => {
    gridViewBtn.classList.add('active');
    mindmapViewBtn.classList.remove('active');
    traditionalView.style.display = 'block';
    mindmapView.style.display = 'none';
  });

  mindmapViewBtn.addEventListener('click', () => {
    mindmapViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    traditionalView.style.display = 'none';
    mindmapView.style.display = 'block';

    if (!mindmapInitialized) {
      buildMindmap();
      mindmapInitialized = true;
    } else {
      triggerBurstAnimation();
    }
  });

  // 마인드맵 절대 좌표계 설계
  const centerX = 1500;
  const centerY = 1000;

  const nodeMap = [];
  let isBurst = false;

  function buildMindmap() {
    nodesLayer.innerHTML = '';
    if (svg) svg.innerHTML = '';
    nodeMap.length = 0;

    // [0] 거대한 3D 배경 타이포그래피 (씨네마틱 깊이감)
    createBgTypo('THE INFINITY', centerX, centerY, -1500, 15);
    createBgTypo('UPPER MOONS', centerX, centerY - 500, -1000, 8);
    createBgTypo('LOWER MOONS', centerX, centerY + 500, -1000, 8);

    // [A] 마스터 코어 노드 (Sleek Monolithic Card)
    const coreNode = document.createElement('div');
    coreNode.className = 'mindmap-node core-node 3d-core cinematic-card';
    coreNode.style.left = `${centerX}px`;
    coreNode.style.top = `${centerY}px`;
    
    coreNode.innerHTML = `
      <div class="cinematic-img-wrapper">
        <img src="${members.master[0].img}" alt="MASTER">
        <div class="cinematic-overlay"></div>
      </div>
      <div class="cinematic-info">
        <div class="cine-rank" style="color: #ff1a4a">MASTER</div>
        <div class="cine-name">${members.master[0].name}</div>
      </div>
    `;
    
    coreNode.onclick = () => {
      if (!isBurst) triggerBurstAnimation();
      else openMemberModal(members.master[0]);
    };
    nodesLayer.appendChild(coreNode);
    nodeMap.push({ el: coreNode, x: centerX, y: centerY, targetX: centerX, targetY: centerY, targetZ: -200, isCore: true });

    // [B] 서열 멤버 노드
    const upperMembers = members.upper || [];
    upperMembers.forEach((m, idx) => {
      const spreadX = (idx - Math.floor(upperMembers.length / 2)) * 220;
      const zDepth = Math.random() * -600 - 100;
      createMemberNode(m, centerX + spreadX, centerY - 450, zDepth);
    });

    const lowerMembers = members.lower || [];
    lowerMembers.forEach((m, idx) => {
      const spreadX = (idx - Math.floor(lowerMembers.length / 2)) * 220;
      const zDepth = Math.random() * -600 - 100;
      createMemberNode(m, centerX + spreadX, centerY + 450, zDepth);
    });

    const newMembers = members.new || [];
    newMembers.forEach((m, idx) => {
      const spreadX = (idx % 3) * 120;
      const spreadY = Math.floor(idx / 3) * 150;
      createMemberNode(m, centerX + 600 + spreadX, centerY + 300 + spreadY, -800, 0.7);
    });

    updateTransform();
    
    // 초기화: 마스터만 노출
    gsap.set('.member-node:not(.core-node)', { left: centerX, top: centerY, z: 0, opacity: 0, scale: 0.2, filter: 'blur(20px)' });
    gsap.set('.bg-typo', { opacity: 0, scale: 0.5, z: -3000 });
    isBurst = false;
  }

  function createBgTypo(text, tx, ty, tz, blur) {
    const typo = document.createElement('div');
    typo.className = 'bg-typo';
    typo.innerHTML = text;
    typo.style.left = `${tx}px`;
    typo.style.top = `${ty}px`;
    typo.dataset.targetZ = tz;
    typo.dataset.blur = blur;
    nodesLayer.appendChild(typo);
  }

  function createMemberNode(m, tx, ty, tz, forceScale = 1) {
    const memNode = document.createElement('div');
    memNode.className = 'mindmap-node member-node floating-node cinematic-card';
    memNode.style.left = `${centerX}px`;
    memNode.style.top = `${centerY}px`;
    memNode.style.setProperty('--node-color', m.color || '#ff1a4a');
    
    memNode.innerHTML = `
      <div class="cinematic-img-wrapper">
        <img src="${m.img}" alt="${m.name}">
        <div class="cinematic-overlay"></div>
      </div>
      <div class="cinematic-info">
        <div class="cine-rank" style="color: ${m.color || '#fff'}">${m.rank}</div>
        <div class="cine-name">${m.name}</div>
      </div>
    `;
    
    memNode.onclick = () => openMemberModal(m);
    nodesLayer.appendChild(memNode);

    nodeMap.push({
      el: memNode,
      x: centerX,
      y: centerY,
      targetX: tx,
      targetY: ty,
      targetZ: tz,
      targetScale: forceScale,
      isCore: false
    });
  }

  function triggerBurstAnimation() {
    isBurst = true;
    gsap.killTweensOf('.mindmap-node, .bg-typo');

    const instruction = document.getElementById('space-instruction');
    if (instruction) gsap.to(instruction, { opacity: 0, duration: 0.5 });

    // 배경 타이포그래피 등장 (Depth 확립)
    document.querySelectorAll('.bg-typo').forEach((el, i) => {
      gsap.to(el, {
        z: el.dataset.targetZ,
        opacity: 0.15,
        scale: 1,
        filter: `blur(${el.dataset.blur}px)`,
        duration: 2.5,
        delay: i * 0.1,
        ease: "expo.out"
      });
    });

    // 마스터 코어 Z축 후퇴
    const core = nodeMap.find(n => n.isCore);
    if (core) {
      gsap.to(core.el, {
        z: core.targetZ,
        duration: 1.5,
        ease: "power3.out",
        boxShadow: "0 0 100px rgba(255, 26, 74, 0.2)"
      });
    }

    // 멤버들 3D 공간으로 폭발 (Cinematic Depth of Field)
    nodeMap.forEach((node) => {
      if (!node.isCore) {
        // Z축 깊이에 따른 블러(DOF) 동적 계산
        const dofBlur = node.targetZ < -400 ? Math.abs(node.targetZ + 400) * 0.01 : 0;
        
        gsap.to(node.el, {
          left: node.targetX,
          top: node.targetY,
          z: node.targetZ,
          scale: node.targetScale,
          opacity: 1,
          filter: `blur(${dofBlur}px)`,
          duration: 1.8,
          delay: Math.random() * 0.2,
          ease: "expo.out"
        });
      }
    });

    // 3D Parallax MouseMove 바인딩 (극대화된 카메라 워크)
    window.addEventListener('mousemove', handleParallax);
  }

  function handleParallax(e) {
    if (!isBurst || isDragging) return;
    const mouseX = (e.clientX / window.innerWidth) - 0.5;
    const mouseY = (e.clientY / window.innerHeight) - 0.5;

    // 카메라(컨테이너 전체) 미세 패럴랙스
    gsap.to(canvas, {
      rotationY: mouseX * 8,
      rotationX: mouseY * -8,
      x: mouseX * -100,
      y: mouseY * -100,
      duration: 1.5,
      ease: 'power2.out'
    });

    // 개별 카드 시차 적용
    gsap.to('.floating-node', {
      x: mouseX * -40,
      y: mouseY * -40,
      duration: 1,
      ease: 'power2.out',
      stagger: 0.002
    });
    
    // 배경 타이포그래피 시차 극대화
    gsap.to('.bg-typo', {
      x: mouseX * 150,
      y: mouseY * 150,
      duration: 2,
      ease: 'power2.out'
    });
  }
}

