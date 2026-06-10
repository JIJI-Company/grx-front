/** 👾 매트릭스 스타일 데코 텍스트 디코딩 클래스 */
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
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
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

function moveSlider(amount) {
  const slider = document.getElementById('memberSlider');
  if (slider) {
    const targetScroll = slider.scrollLeft + amount;
    gsap.to(slider, {
      scrollLeft: targetScroll,
      duration: 0.8,
      ease: "power3.out",
      overwrite: "auto"
    });
  }
}

// ⚡ 라이브 데이터 사전 로드 (LIVE 페이지 진입 시 속도 향상을 위해)
DataService.getLive().then(data => {
  console.log("[Prefetch] Live data ready.");
  if (data) renderHomeLiveStatus(data); // 홈 화면의 실시간 상태도 즉시 업데이트
});

document.addEventListener('DOMContentLoaded', () => {
  // 🌊 [Lenis 초고성능 스무스 스크롤 연동]
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1.0,
      smoothTouch: false,
      touchMultiplier: 2.0
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  const enterBtn = document.getElementById('enter-btn');
  const gate = document.getElementById('intro-gate');
  const introContent = document.querySelector('.intro-content');

  // 팝업 트리거 헬퍼 (게이트 상황에 맞게 딜레이 조절)
  const triggerPopup = (delay) => {
    if (typeof CONFIG !== 'undefined' && CONFIG.EVENT_POPUP && CONFIG.EVENT_POPUP.enable) {
      if (!sessionStorage.getItem("eventPopupClosed")) {
        setTimeout(showEventPopup, delay);
      }
    }
  };

  // 🎥 [프리미엄 무한성 등장 효과]
  const triggerHeroReveal = () => {
    // 초기 투명도 및 Y축 시작점 세팅
    gsap.set([".hero-label", ".hero h1", ".hero p", ".scroll-indicator"], { opacity: 0, y: 60 });
    gsap.set(".logo", { opacity: 0, y: -30 });
    gsap.set(".nav-links a", { opacity: 0, y: -30 });

    // 네비게이션 바 로드
    gsap.to(".logo", { opacity: 1, y: 0, duration: 1.0, delay: 0.2, ease: "power3.out" });
    gsap.to(".nav-links a", { opacity: 1, y: 0, stagger: 0.08, duration: 1.0, delay: 0.3, ease: "power3.out" });

    // 히어로 섹션 요소 순차 등장 (stagger + 탄성) (h1 제목 제외)
    gsap.to([".hero-label", ".hero p", ".scroll-indicator"], {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 1.5,
      delay: 0.5,
      ease: "power4.out"
    });

    // 👾 [매트릭스 스크램블 효과로 히어로 타이틀 해독 전개]
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
      gsap.set(heroTitle, { opacity: 1, y: 0 });
      const fx = new TextScramble(heroTitle);
      setTimeout(() => {
        fx.setText('GGU CASTLE');
      }, 500);
    }
  };

  // 한 번 봤으면 게이트 스킵
  if (sessionStorage.getItem('gateShown')) {
    if (gate) gate.style.display = 'none';
    document.body.classList.add('show-main');
    triggerPopup(1000); // 메인화면 바로 진입 시 1초 뒤 등장
    setTimeout(triggerHeroReveal, 100);
  }

  if (enterBtn && gate) {
    enterBtn.addEventListener('click', () => {
      // 1. 게이트 벌어지는 효과
      gate.classList.add('open');

      if (introContent) {
        // 인트로 문구 부드럽게 퇴장
        gsap.to(introContent, {
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: "power2.in",
          pointerEvents: "none"
        });
      }

      document.body.classList.add('show-main');
      
      // 2. 웅장한 무한성 콘텐츠 등장 연출 가동
      triggerHeroReveal();

      setTimeout(() => {
        gate.style.display = 'none';
        sessionStorage.setItem('gateShown', 'true'); // 본 것으로 저장
        
        triggerPopup(500); // 👉 무한성 게이트가 완전히 열리고 0.5초 뒤에 팝업 등장!
      }, 1200);
    });
  }

  // nav 스크롤 효과
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(0, 0, 0, 0.95)';
      nav.style.borderBottom = '1px solid rgba(139, 0, 0, 0.6)';
    } else {
      nav.style.background = 'rgba(0, 0, 0, 0.8)';
      nav.style.borderBottom = '1px solid rgba(139, 0, 0, 0.4)';
    }
  });

  // 메뉴 활성화
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });

  // animate-fade-in 스크롤 감지
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll('.animate-fade-in')
    .forEach((el) => observer.observe(el));

  // 🔔 [NEW] 홈 뉴스 및 유튜브 렌더링
  renderHomeNews();
  renderYoutubeFeed();
  checkLiveStatus();
  renderHomeSchedule();

  // 🛡️ [Safety Timeout] 3초 뒤에도 섹션이 안 보이면 강제로 활성화
  setTimeout(() => {
    document.querySelectorAll('.animate-fade-in:not(.is-visible)').forEach(el => {
      el.classList.add('is-visible');
    });
  }, 3000);

  // 🖱️ [고급 마우스 패럴랙스 - 물리 엔진처럼 부드러운 글라이딩 인터랙션]
  const heroSection = document.getElementById('heroSection');
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const xPos = (e.clientX / window.innerWidth) - 0.5;
      const yPos = (e.clientY / window.innerHeight) - 0.5;
      
      heroSection.querySelectorAll('.parallax-layer').forEach(layer => {
        const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
        const xOffset = xPos * speed * window.innerWidth;
        const yOffset = yPos * speed * window.innerHeight;
        
        // style 조작 대신 GSAP으로 속도감 있고 탄성 있게 애니메이션 처리
        gsap.to(layer, {
          x: xOffset,
          y: yOffset,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    });
  }

  // 🌌 [ScrollTrigger 기반 무한성 공간 스크롤 3D 패럴랙스]
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const heroBg = document.querySelector('.hero-bg');
    const heroContent = document.querySelector('.hero-content-wrap');
    const verticalText = document.querySelector('.hero-vertical-text');

    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 20,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: "#heroSection",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -15,
        opacity: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: "#heroSection",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    if (verticalText) {
      gsap.to(verticalText, {
        yPercent: -40,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "#heroSection",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  // 👾 [메뉴 및 버튼 매트릭스 데코 텍스트 스크램블 등록]
  if (typeof TextScramble !== 'undefined') {
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

    const enterBtnElement = document.getElementById('enter-btn');
    if (enterBtnElement) {
      const originalText = enterBtnElement.innerText;
      const fx = new TextScramble(enterBtnElement);
      let isScrambling = false;
      
      enterBtnElement.addEventListener('mouseenter', () => {
        if (isScrambling) return;
        isScrambling = true;
        fx.setText(originalText).then(() => {
          isScrambling = false;
        });
      });
    }
  }

  // 💎 [3D 홀로그램 카드 틸트 & 광택 효과 적용]
  init3DTilt();
});

/** 💎 3D 카드 틸트 및 광택(Shimmer) 이펙트 초기화 함수 */
function init3DTilt() {
  const cards = document.querySelectorAll('.card, .update-box');
  
  cards.forEach(card => {
    // 1. 홀로그램 광택 레이어 동적 주입
    let shimmer = card.querySelector('.card-shimmer');
    if (!shimmer) {
      shimmer = document.createElement('div');
      shimmer.className = 'card-shimmer';
      shimmer.style.cssText = `
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 0% 0%, rgba(225, 29, 72, 0.15) 0%, transparent 60%);
        pointer-events: none;
        z-index: 3;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      card.appendChild(shimmer);
    }
    
    // 2. 3D 원근법 스타일 강제 적용
    card.style.transformStyle = 'preserve-3d';
    card.style.perspective = '1000px';

    // 3. 마우스 진입 시 크기 확장 & 쉐도우 증폭
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.03,
        boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(225, 29, 72, 0.25)',
        borderColor: 'rgba(225, 29, 72, 0.5)',
        duration: 0.4,
        ease: 'power2.out'
      });
      shimmer.style.opacity = '1';
    });

    // 4. 마우스 무브에 따른 3D 기울기 실시간 계산 및 부드러운 렌더링
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 회전값 조율 (-8도 ~ 8도 제한으로 부담스럽지 않게 세팅)
      const rotX = -((y - centerY) / centerY) * 8;
      const rotY = ((x - centerX) / centerX) * 8;
      
      gsap.to(card, {
        rotationX: rotX,
        rotationY: rotY,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto'
      });
      
      // 마우스 좌표에 매핑된 실시간 홀로그램 광택 좌표 갱신
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      shimmer.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(225, 29, 72, 0.25) 0%, transparent 60%)`;
    });

    // 5. 마우스 이탈 시 복구
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        boxShadow: '0 15px 30px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(225, 29, 72, 0.15)',
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto'
      });
      gsap.to(shimmer, { opacity: 0, duration: 0.6 });
    });
  });
}

/** 🎇 팝업 생성 및 노출 함수 */
function showEventPopup() {
  const conf = CONFIG.EVENT_POPUP;
  const imageHtml = conf.imageUrl ? `<img src="${conf.imageUrl}" class="event-image">` : "";
  const linkHtml = conf.link ? `<a href="${conf.link}" target="_blank" class="event-link-btn">자세히 보기</a>` : "";
  
  const popupHtml = `
    <div id="eventModal" class="event-modal-overlay">
      <div class="event-modal-content">
        <button class="event-close-btn" onclick="closeEventPopup()">✕</button>
        ${imageHtml}
        <div class="event-text-area">
          <h2 class="event-title">${conf.title}</h2>
          <p class="event-message">${conf.message}</p>
          ${linkHtml}
        </div>
        <div class="event-party-popper">🎉</div>
        <div class="event-party-popper right">🎊</div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
  
  // 약간의 딜레이 후 애니메이션 작동
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.getElementById('eventModal').classList.add('is-visible');
    }, 50);
  });
}

/** 🎇 팝업 닫기 함수 */
window.closeEventPopup = function() {
  const modal = document.getElementById('eventModal');
  if (modal) {
     modal.classList.remove('is-visible');
     modal.classList.add('fade-out');
     // 애니메이션 완료 후 DOM에서 삭제
     setTimeout(() => modal.remove(), 400); 
     // 현재 세션동안 다시 안보게 저장
     sessionStorage.setItem("eventPopupClosed", "true");
  }
}


async function checkLiveStatus() {
  const container = document.getElementById('liveStatusContainer');
  const portal = document.getElementById('livePortalContent');
  if (!container || !portal) return;

  // 🔄 로딩 상태 표시
  portal.innerHTML = '<span class="loading-pulse">무한성의 신호를 감지하고 있습니다...</span>';

  try {
    const liveData = await DataService.getLive();
    
    if (!liveData || (Array.isArray(liveData) && liveData.length === 0)) {
       console.warn("Live status data is empty");
       setOfflineUI(container, portal, "현재 무한성 관측 범위 내에 방송 신호가 없습니다.");
       return;
    }

    const activeStreams = (Array.isArray(liveData) ? liveData : []).filter(s => {
        const status = String(s.status || s.isLive || "").toUpperCase().trim();
        return status === 'ON-AIR' || status === 'ON_AIR' || status === 'Y' || status === 'LIVE';
    });

    if (activeStreams.length === 0) {
      setOfflineUI(container, portal, "현재 무한성 관측 범위 내에 방송 신호가 없습니다.");
      return;
    }

    container.innerHTML = `
      <div class="status-indicator online"></div>
      <span class="status-text" style="color:#ff1a4a;">ON AIR / SYSTEM_ACTIVE</span>
    `;

    // 멤버 이미지 맵핑
    const memberImages = {
      "꾸티뉴": "img/ggutinho.png", "엔쥬": "img/enju.png",
      "난워니": "img/nanana.png", "야무지": "img/yamuzi.png",
      "리카": "img/lika.png",
      "다뮤": "img/damu.jpeg", "딴딴2당": "img/ttanttan.jpeg",
      "바먀": "img/baamya.png",
      "서라0": "img/서라0.jpg",
      "임민트": "img/mint.png",
      "김옥독": "img/okdok.png",
      "냥쏘": "img/nangsso.png",
      "윤타미": "img/tami.png",
      "모야": "img/moya.png"
    };

    function getAvatar(name) {
      const n = name.replace(/\s+/g, "");
      for (const key in memberImages) {
        if (n.includes(key) || key.includes(n)) return memberImages[key];
      }
      return 'https://via.placeholder.com/80/2a0005/ff1a4a?text=' + name.charAt(0);
    }

    if (activeStreams.length === 1) {
      // 🟢 단독 방송 - 초고급화 & 넓은 프로필 중심 레이아웃
      const stream = activeStreams[0];
      const name = stream.name || stream.bj_name || 'CREW';
      let imgUrl = stream.thumbnail || getAvatar(name); // SOOP 썸네일 우선 적용
      // 썸네일 캐시 방지 처리
      if(imgUrl.includes('liveimg.sooplive.co.kr')) {
          imgUrl += `?t=${Date.now()}`;
      }
      const platformLower = (stream.platform || "").toLowerCase();

      portal.innerHTML = `
        <div class="premium-live-single animate-fade-in is-visible">
          <div class="live-hero-avatar ${stream.thumbnail ? 'has-thumbnail' : ''}">
            <div class="hero-ring"></div>
            <img src="${imgUrl}" alt="${name}">
            <div class="hero-badge">ON AIR</div>
          </div>
          
          <div class="live-info-panel">
            <div class="premium-platform ${platformLower}">${stream.platform || 'SOOP'}</div>
            <h2 class="premium-streamer-name">${name}</h2>
            <p class="premium-stream-title" title="${stream.liveTitle || stream.title || '현재 방송 중입니다.'}">
              ${stream.liveTitle || stream.title || '단독 방송 송출 중입니다!'}
            </p>
            
            <button class="premium-action-btn" onclick="window.open('${stream.link || ('http://play.sooplive.com/' + (stream.BJ_ID || stream.bj_id))}', '_blank')">
              라이브 참여하기 <span class="arrow-icon">➜</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // 🔵 여러 명 방송 - 프리미엄 아바타 팝업 목록 형식
      let multiIconsHtml = activeStreams.map(stream => {
          const name = stream.name || stream.bj_name || 'CREW';
          const imgUrl = getAvatar(name);
          return `
            <div class="premium-multi-item" onclick="window.open('${stream.link}', '_blank')" title="${name} - ${stream.title || '방송중'}">
               <div class="multi-avatar-shell">
                 <img src="${imgUrl}" alt="${name}">
                 <div class="multi-live-dot"></div>
               </div>
               <span class="premium-multi-name">${name}</span>
               <span class="premium-multi-plat">${stream.platform || 'ON'}</span>
            </div>
          `;
      }).join('');

      portal.innerHTML = `
        <div class="premium-live-multi animate-fade-in is-visible">
          <div class="multi-header">
            현재 <span class="highlight">${activeStreams.length}명</span>의 멤버가 라이브 중입니다 📡
          </div>
          <div class="multi-avatar-grid">
             ${multiIconsHtml}
          </div>
        </div>
      `;
    }
  } catch (e) {
    console.error("Live status check failed", e);
    setOfflineUI(container, portal, "방송 데이터를 수신하지 못했습니다.");
  }
}

/** ⚪ 오프라인 상태 공통 UI 함수 */
function setOfflineUI(container, portal, message) {
  container.innerHTML = `
    <div class="status-indicator offline"></div>
    <span class="status-text">OFFLINE</span>
  `;
  portal.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px;">
      <div style="font-size: 2rem; opacity:0.5;">💤</div>
      <span style="color:#888;">${message}</span>
    </div>
  `;
}

// 🔑 YouTube 설정 (보안을 위해 API_KEY는 Netlify 환경 변수로 이동)
async function renderYoutubeFeed() {
  const container = document.getElementById('youtubeFeed');
  if (!container) return;

  const CHANNEL_ID = "UChU1YQle9vX1xRipUcBcR5g";
  const UPLOADS_PLAYLIST_ID = CHANNEL_ID.replace(/^UC/, 'UU');

  // 🏛️ [V7.2] YouTube Proxy 호출
  const PROXY_URL = `/.netlify/functions/youtube-proxy?playlistId=${UPLOADS_PLAYLIST_ID}`;

  try {
    const res = await fetch(PROXY_URL);
    if (!res.ok) {
      if (res.status === 403) throw new Error("API 키 권한 오류 (할당량 초과 또는 키 미승인)");
      throw new Error(`API 요청 실패 (${res.status})`);
    }

    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const latest = data.items[0].snippet;
      const title = latest.title;
      const videoId = latest.resourceId.videoId;
      const link = `https://www.youtube.com/watch?v=${videoId}`;
      const pubDate = latest.publishedAt.split('T')[0].replace(/-/g, '.');
      const thumbnail = latest.thumbnails.high ? latest.thumbnails.high.url : latest.thumbnails.default.url;

      container.innerHTML = `
        <div class="yt-thumb-container" onclick="window.open('${link}', '_blank')">
          <img src="${thumbnail}" class="yt-thumb" alt="Latest Video">
          <div class="yt-play-icon">▶</div>
        </div>
        <div class="yt-info">
          <div class="yt-title" title="${title}">${title}</div>
          <div class="yt-meta">${pubDate} · YouTube Update</div>
        </div>
      `;
    } else {
      throw new Error("채널에 영상이 없습니다.");
    }
  } catch (e) {
    console.error("YouTube Fetch Error:", e);
    // 에러 발생 시 안내 문구를 자연스럽고 친절하게 변경 (기술적인 용어 제거)
    container.innerHTML = `
      <div class="yt-placeholder" onclick="window.open('https://www.youtube.com/channel/${CHANNEL_ID}', '_blank')">
        <p>서버 지연으로 영상을 바로 불러올 수 없습니다.</p>
        <span style="font-size: 0.8rem; color: #888; margin-top: 5px;">여기를 클릭하여 유튜브에서 직접 확인하세요!</span>
      </div>
    `;
  }
}

async function renderHomeNews() {
  const grid = document.getElementById('homeNewsGrid');
  if (!grid) return;

  // 🔔 SWR 전략: 캐시 데이터를 먼저 보여주고, 배경에서 뉴스를 가져옵니다.
  const newsList = await DataService.getData('times', (updatedNews) => {
    displayNews(grid, updatedNews.slice(0, 2));
  }) || [];
  
  displayNews(grid, newsList.slice(0, 2));
}

/** 실제 뉴스 카드를 화면에 그리는 함수 */
function displayNews(grid, items) {
  if (!items || items.length === 0) {
    grid.innerHTML = '<p style="color:#666; width: 100%; text-align: center;">뉴스를 불러오는 중이거나 기록이 없습니다.</p>';
    return;
  }

  grid.innerHTML = ''; 
  items.forEach(news => {
    const card = document.createElement('div');
    card.className = "card";
    card.style.cursor = "pointer";
    card.onclick = () => window.open(news.link, '_blank');
    
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-header">
          <span class="card-tag">${news.tag || 'NEWS'}</span>
          <span class="card-date">${news.date || 'RECENT'}</span>
        </div>
        <h3 class="card-title">${news.title}</h3>
        <p class="card-desc">${news.desc || news.achievement || ''}</p>
        <div class="card-arrow">READ MORE →</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

/** 메인화면 미니 스케줄 렌더러 */
async function renderHomeSchedule() {
  const container = document.getElementById('homeScheduleList');
  if (!container) return;
  
  try {
    const schedules = await DataService.getSchedules();

    if (!Array.isArray(schedules)) {
      console.error("Schedules data is not an array:", schedules);
      container.innerHTML = '<div style="text-align:center; padding:20px; color:#666; font-size:0.85rem;">진행 예정인 일정이 없습니다.</div>';
      return;
    }

    // 📅 [날짜순 정렬 보강] 시간(MM.dd HH:mm) 문자열을 기준으로 내림차순 정렬
    const sortedSchedules = [...schedules].sort((a, b) => {
      const timeA = a.Time || a.time || "";
      const timeB = b.Time || b.time || "";
      return timeB.localeCompare(timeA); // 최신 날짜가 앞으로 오게 정렬
    });

    const top3 = sortedSchedules.slice(0, 3);

    if (!top3 || top3.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:20px; color:#666; font-size:0.85rem;">진행 예정인 일정이 없습니다.</div>';
      return;
    }
    
    container.innerHTML = top3.map(sc => {
      const name = sc.Member || sc.member || "CREW";
      const avatar = sc.Avatar || sc.avatar || `img/${name}.png`;
      const time = sc.Time || sc.time || "RECENT";
      const title = sc.Title || sc.title || "새로운 공지사항";

      return `
        <div class="schedule-item-mini" onclick="window.open('${sc.Link || '#'}', '_blank')" style="cursor:pointer;">
           <span class="cat-badge">NEWS</span>
           <div class="sch-main">
             <h4 class="sch-title">${title}</h4>
             <span class="sch-time">${time}</span>
           </div>
           <div class="sch-member">
             <img src="${avatar}" alt="${name}" onerror="this.src='img/ggu_title.jpg'">
             <span>${name}</span>
           </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Home schedule render error:", err);
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#ff1a4a; font-size:0.8rem;">일정을 불러오지 못했습니다.</div>';
  }
}

