function moveSlider(amount) {
  const slider = document.getElementById('memberSlider');
  slider.scrollLeft += amount;
}

// ⚡ 라이브 데이터 사전 로드 (LIVE 페이지 진입 시 속도 향상을 위해)
DataService.getLive().then(data => {
  console.log("[Prefetch] Live data ready.");
  if (data) renderHomeLiveStatus(data); // 홈 화면의 실시간 상태도 즉시 업데이트
});

document.addEventListener('DOMContentLoaded', () => {
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

  // 한 번 봤으면 게이트 스킵
  if (sessionStorage.getItem('gateShown')) {
    if (gate) gate.style.display = 'none';
    document.body.classList.add('show-main');
    triggerPopup(1000); // 메인화면 바로 진입 시 1초 뒤 등장
  }

  if (enterBtn && gate) {
    enterBtn.addEventListener('click', () => {
      gate.classList.add('open');

      if (introContent) {
        introContent.style.opacity = '0';
        introContent.style.transform = 'scale(0.8)';
        introContent.style.pointerEvents = 'none';
      }

      document.body.classList.add('show-main');

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

  // 🎇 팝업 노출 로직은 윗부분의 게이트 컨트롤(triggerPopup)으로 이동되었습니다.

  // 🖱️ 패럴랙스 (마우스 이동 대응)
  const heroSection = document.getElementById('heroSection');
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const xPos = (e.clientX / window.innerWidth) - 0.5;
      const yPos = (e.clientY / window.innerHeight) - 0.5;
      
      heroSection.querySelectorAll('.parallax-layer').forEach(layer => {
        const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
        const xOffset = xPos * speed * window.innerWidth;
        const yOffset = yPos * speed * window.innerHeight;
        layer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    });
  }
});

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
      "란다": "img/randa.png", "셀키": "img/selky.png",
      "리카": "img/lika.png",
      "구본좌": "img/koo.png", "영감": "img/younggam.png",
      "다뮤": "img/damu.jpeg", "딴딴2당": "img/ttanttan.jpeg",
      "초귀요미": "img/cho-cutie.png", "밈먀": "img/mimmya.png",
      "바먀": "img/baamya.png",
      "서라0": "img/서라0.jpg"
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

