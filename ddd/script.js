// ════════════════════════════════════
// 🔴 GUESTBOOK 더미 데이터
// ════════════════════════════════════
const initialMessages = [
  { author: '무명의 혈귀', target: '꾸티뉴', text: '마스터님 이번 합동 방송 최고였습니다!! 영원히 충성!! 🔥' },
  { author: '달빛 검사', target: '야무지', text: '야무지님 달의 호흡 폼 미쳤다... 랭크전 1위 기원합니다!' },
  { author: '북극의 사냥꾼', target: '엔쥬', text: '얼음 깎는 장인 엔쥬 화이팅! 빙결 혈귀술 만만세 ❄️' },
  { author: '주먹이 운다', target: '란다', text: '파괴살 권술 타격감 완전 돌았음... 란다님 방송 너무 재밌어요!' },
  { author: '항아리 요정', target: '리카', text: '리카님 항아리 소환할 때마다 빵빵 터져요 ㅋㅋㅋ' },
  { author: '하현 뉴비', target: '하현', text: '하현 분들 다들 너무 귀여우신 거 아닙니까 ㅠㅠ 다뮤 난워니 화이팅!' },
];

// 📰 KKUHAN TIMES 데이터 변수
let timesData = [];


// ════════════════════════════════════
// 🎨 GALLERY 데이터 변수
const staticImages = [
  { author: "GRVR", desc: "고퀄리티 스페셜 - 꾸티뉴", img: "/img2/ggutinho.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 난워니", img: "/img2/nanwoni.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 다뮤", img: "/img2/damu.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 딴딴", img: "/img2/ttanttan.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 란다", img: "/img2/randa.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 리카", img: "/img2/lika.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 바먀", img: "/img2/baamya.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 야주미", img: "/img2/yamuzi.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 엔쥬", img: "/img2/enju.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 초구ㅏ", img: "/img2/chogua.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 서라0", img: "/img2/seora0.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 임민트", img: "/img/mint.png" }
];
let galleryData = [];


// ── 페이지 초기화 분기 처리 ──
document.addEventListener('DOMContentLoaded', async () => {
  // 공통 프리미엄 인터랙션 구동
  initCommonInteractions();

  initNav();
  
  // 1. GUESTBOOK 초기화
  const skyContainer = document.getElementById('talismanSky');
  if(skyContainer) {
    initialMessages.forEach((msg, idx) => {
      spawnTalisman(msg.author, msg.target, msg.text, idx * 300);
    });
    initGuestbookForm();
  }
  
  // 2. TIMES 초기화 (SWR 적용: 캐시 즉시 출력 + 배경 업데이트)
  const timesTimeline = document.getElementById('timesTimeline');
  if(timesTimeline) {
    timesData = await DataService.getData('times', (updatedData) => {
      timesData = updatedData || [];
      // 기존 타임라인 비우고 다시 그리기
      if(timesTimeline) timesTimeline.innerHTML = '';
      initTimes();
    }) || [];
    initTimes();
  }
  
  /*
  const galleryMasonry = document.getElementById('galleryMasonry');
  if(galleryMasonry) {
    initGallery(galleryMasonry);
    initGalleryAdmin();
  }
  */
});

// ════════════════════════════════════
// [ 관리자 전용 ] GALLERY ADMIN 로직
// ════════════════════════════════════
function toggleAdminModal() {
  const modal = document.getElementById('adminModal');
  if(!modal) return;
  modal.style.display = (modal.style.display === 'none') ? 'block' : 'none';
}

function initGalleryAdmin() {
  const form = document.getElementById('adminGalleryForm');
  if(!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "통신 중...";

    const payload = {
      action: 'addGallery',
      thumbnail: document.getElementById('artUrl').value.trim(),
      author: document.getElementById('artAuthor').value.trim() || 'G-CASTLE',
      description: document.getElementById('artDesc').value.trim(),
      url: document.getElementById('artLink').value.trim()
    };

    try {
      // GAS Proxy를 통해 데이터 전송 (GET 쿼리 스트링 방식 혹은 POST 지원 필요)
      // 현재는 호환성을 위해 쿼리 파라미터로 시도해봅니다.
      const query = new URLSearchParams(payload).toString();
      const targetUrl = `${CONFIG.GAS_PROXY}?sheet=Gallery&type=gallery&${query}`;
      
      const response = await fetch(targetUrl);
      const resData = await response.json();

      if (resData.error) throw new Error(resData.message);

      alert('성공적으로 작품이 등록되었습니다! 🎨');
      toggleAdminModal();
      location.reload(); // 즉시 확인을 위해 리로드
    } catch (err) {
      console.error(err);
      alert('등록 중 오류가 발생했습니다. (GAS/네트워크 확인 필요)\n' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = "등록 수행";
    }
  });
}

// ════════════════════════════════════
// [ 라이트박스 뷰어 로직 ]
// ════════════════════════════════════
window.openLightbox = (src, author, desc, originLink) => {
  const box = document.getElementById('galleryLightbox');
  if(!box) return;
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxDesc').innerText = desc;
  document.getElementById('lightboxAuthor').innerHTML = `BY: ${author} &nbsp;&nbsp;|&nbsp;&nbsp; <a href="${originLink}" target="_blank" style="color:#ff1a4a;">원본 열기</a>`;
  
  box.style.display = 'flex';
  requestAnimationFrame(() => {
    box.style.opacity = '1';
    document.getElementById('lightboxImg').style.transform = 'scale(1)';
  });
};

window.closeLightbox = () => {
  const box = document.getElementById('galleryLightbox');
  if(!box) return;
  box.style.opacity = '0';
  document.getElementById('lightboxImg').style.transform = 'scale(0.9)';
  setTimeout(() => box.style.display = 'none', 300);
};

// ════════════════════════════════════
// [1] GUESTBOOK 로직 (기능 중단됨)
// ════════════════════════════════════
function spawnTalisman(author, target, text, delayMs = 0) {
  // 방명록 기능 중단 (필요 시 아래 setTimeout 로직을 다시 활성화하세요)
  /*
  setTimeout(() => {
    const skyContainer = document.getElementById('talismanSky');
    if(!skyContainer) return;
    
    const card = document.createElement('div');
    card.classList.add('talisman-card');
    
    const top = 10 + Math.random() * 70;
    const left = 5 + Math.random() * 80;
    const animDelay = Math.random() * 5;
    const rotateZ = -10 + Math.random() * 20;

    card.style.top = top + '%';
    card.style.left = left + '%';
    card.style.animationDelay = `-${animDelay}s`;
    
    const scale = 0.7 + Math.random() * 0.4;
    const zIdx = Math.floor(scale * 10);
    card.style.transform = `scale(${scale}) rotateZ(${rotateZ}deg)`;
    card.style.zIndex = zIdx;
    
    card.innerHTML = `
      <div class="tali-target">TO: ${target}</div>
      <div class="tali-msg">"${text}"</div>
      <div class="tali-author">- ${author}</div>
    `;
    
    initTiltEffect(card);
    skyContainer.appendChild(card);
    
    const rect = card.getBoundingClientRect();
    createExplosion(rect.left + rect.width/2, rect.top + rect.height/2, 10);
  }, delayMs);
  */
}

function initTiltEffect(el) {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    const scale = el.style.transform.match(/scale\(([^)]+)\)/);
    const originScale = scale ? scale[1] : 1;
    const rotateZ = el.style.transform.match(/rotateZ\(([^)]+)deg\)/);
    const originZ = rotateZ ? rotateZ[1] : 0;
    
    el.style.transform = `scale(${originScale}) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${originZ}deg) scale3d(1.1, 1.1, 1.1)`;
  });
  
  el.addEventListener('mouseleave', () => {
    const scale = el.style.transform.match(/scale\(([^)]+)\)/);
    const originScale = scale ? scale[1] : 1;
    const rotateZ = el.style.transform.match(/rotateZ\(([^)]+)deg\)/);
    const originZ = rotateZ ? rotateZ[1] : 0;
    el.style.transform = `scale(${originScale}) rotateZ(${originZ}deg)`;
  });
}

function initGuestbookForm() {
  const form = document.getElementById('cheerForm');
  const btnSubmit = document.getElementById('btnSubmit');
  if(!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const author = document.getElementById('fanName').value.trim();
    const target = document.getElementById('targetMember').value;
    const text = document.getElementById('fanMessage').value.trim();
    
    if (!author || !text) return;
    
    btnSubmit.style.transform = 'scale(0.95)';
    setTimeout(() => btnSubmit.style.transform = 'translateY(-2px)', 200);
    
    spawnTalisman(author, target, text, 0);
    document.getElementById('fanMessage').value = '';
    setTimeout(() => alert('혈귀술 전언이 송신되었습니다! 🩸'), 300);
  });
}

// ════════════════════════════════════
// [2] KKUHAN TIMES 로직 (무한성의 비록 - 타임라인 리뉴얼)
// ════════════════════════════════════
function initTimes() {
  const container = document.getElementById('timesTimeline');
  if(!container) return;

  if (!timesData || timesData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 100px 20px; color: #555; width: 100%; grid-column: 1/-1;">
        <p style="font-size: 1.2rem; letter-spacing: 2px;">현재 무한성에 기록된 새로운 소식이 없습니다.</p>
        <p style="font-size: 0.8rem; margin-top: 10px; opacity: 0.5;">나중에 다시 방문해 주세요.</p>
      </div>
    `;
    return;
  }

  timesData.forEach((news, idx) => {
    const item = document.createElement('div');
    item.className = "scroll-item";
    
    item.innerHTML = `
      <div class="fusuma-gate">
        <div class="fusuma-left"></div>
        <div class="fusuma-right"></div>
      </div>
      <div class="timeline-node"></div>
      <a href="${news.link}" target="_blank" class="scroll-content">
        <span class="scroll-issue">${news.issue}</span>
        <h3 class="scroll-title">${news.title}</h3>
        <div class="scroll-date">${news.date}</div>
      </a>
    `;
    
    container.appendChild(item);
  });

  // 🚪 [무한성 장벽 미닫이문 - GSAP ScrollTrigger 시네마틱 연동]
  document.querySelectorAll('.scroll-item').forEach(item => {
    const fLeft = item.querySelector('.fusuma-left');
    const fRight = item.querySelector('.fusuma-right');
    const tNode = item.querySelector('.timeline-node');
    const sContent = item.querySelector('.scroll-content');
    
    // 타임라인 아이템 개별 타임라인 생성
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top 88%",   // 화면 88% 지점에 닿았을 때 시작
        end: "top 55%",     // 화면 55% 지점까지 도달 시 문 열림 완료
        scrub: 1.2,         // 1.2초 저항 스크럽으로 버터처럼 부드럽게 동기화
        toggleActions: "play none none reverse"
      }
    });

    if (fLeft && fRight) {
      tl.to(fLeft, { xPercent: -100, duration: 1 }, 0)
        .to(fRight, { xPercent: 100, duration: 1 }, 0);
    }
    
    if (tNode) {
      tl.fromTo(tNode, { scale: 0, backgroundColor: "#555" }, { scale: 1.2, backgroundColor: "#ff1a4a", duration: 0.5 }, 0.2);
    }
    
    if (sContent) {
      tl.fromTo(sContent, 
        { opacity: 0, x: 60, scale: 0.95 }, 
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power2.out" }, 
        0.25
      );
    }
  });
}

// ════════════════════════════════════
// [3] GALLERY 로직
// ════════════════════════════════════
async function initGallery(container) {
  if (!container) return;
  
  // 🔄 초기화 진행
  container.innerHTML = '<div style="text-align:center; padding:50px; width:100%; grid-column:1/-1; color:#888;">데이터를 관측 중입니다...</div>';

  let sheetData = [];
  try {
    // 💡 시트 데이터를 가져오되, 실패해도 멈추지 않게 처리
    sheetData = await DataService.getData('Gallery') || [];
  } catch (err) {
    console.warn("Dynamic gallery fetch failed, showing static images only.", err);
  }

  // 💡 로컬 스페셜 사진 + 시트 데이터를 합칩니다.
  const combinedData = [...staticImages, ...sheetData];
  
  if (combinedData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 100px 20px; color: #555; width: 100%; grid-column: 1/-1;">
        <p style="font-size: 1.2rem; letter-spacing: 2px;">전시된 작품이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ''; // 로딩 문구 제거

  combinedData.forEach((art, idx) => {
    const item = document.createElement('div');
    item.className = "gallery-item";
    
    let link = art.URL || art.url || art.link || '#';
    let thumb = art.Thumbnail || art.thumbnail || art.img || '/img/ggu_title.jpg';
    
    // [구글 드라이브 링크 자동 변환 - Thumbnail API 사용(403 차단 회피용)]
    const getDriveDirectUrl = (url) => {
      if (!url || typeof url !== 'string') return url;
      if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
      return url;
    };

    thumb = getDriveDirectUrl(thumb);
    const author = art.Author || art.author || 'G-CASTLE';
    const desc = art.Description || art.description || art.desc || '무한성 아카이브';

    if (link !== '#') {
      item.onclick = () => openLightbox(thumb, author, desc, link);
      item.style.cursor = 'pointer';
    }
    
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transitionDelay = `${idx * 0.03}s`;
    
    item.innerHTML = `
      <div class="gallery-wrapper" style="width: 100%; min-height: 200px; background: rgba(255,25,74,0.05); border-radius: 4px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
        <img src="${thumb}" alt="${author}" 
             style="width: 100%; display: block; border-radius: 4px; transition: transform 0.5s ease;" 
             onerror="this.src='../img/ggu_title.jpg'; this.style.opacity='0.2';">
      </div>
      <div class="gallery-overlay">
        <div class="gallery-author">BY: ${author}</div>
        <div class="gallery-desc">${desc}</div>
      </div>
    `;
    
    container.appendChild(item);
    
    // 🎨 자유분방한 랜덤 각도 및 오프셋 부여
    const randomTilt = (Math.random() * 8 - 4).toFixed(2); // -4deg ~ 4deg
    const randomOffset = (Math.random() * 20 - 10).toFixed(2); // -10px ~ 10px
    item.style.setProperty('--tilt', `${randomTilt}deg`);
    item.style.setProperty('--offset', `${randomOffset}px`);

    // 🏷️ 작가/설명 텍스트 색상 조정 (흰 배경 대응)
    const overlayAuthor = item.querySelector('.gallery-author');
    const overlayDesc = item.querySelector('.gallery-desc');
    if (overlayAuthor) overlayAuthor.style.color = '#cc0033'; // 진한 루비 레드
    if (overlayDesc) overlayDesc.style.color = '#333'; // 어두운 회색

    setTimeout(() => {
      item.style.opacity = 1;
      item.style.transform = `rotate(${randomTilt}deg) translateY(${randomOffset}px)`;
    }, 100 + (idx * 30));
  });
}

// ════════════════════════════════════
// 🔴 공통 유틸 및 앰비언트 효과
// ════════════════════════════════════
function createExplosion(x, y, count=15) {
  const container = document.getElementById('particles');
  if(!container) return;
  for(let i=0; i<count; i++) {
    const spark = document.createElement('div');
    spark.classList.add('spark');
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 80;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.setProperty('--dx', `${dx}px`);
    spark.style.setProperty('--dy', `${dy}px`);
    container.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
  }
}

/*
document.addEventListener('click', (e) => {
  if (e.target.closest('.talisman-card') || e.target.closest('.guestbook-interface') || e.target.closest('.news-card') || e.target.closest('.gallery-item')) return;
  createExplosion(e.clientX, e.clientY, 8);
});
*/

function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(5, 0, 2, 0.7)';
      nav.style.borderBottom = '1px solid rgba(255, 26, 74, 0.3)';
    } else {
      nav.style.background = 'rgba(5, 0, 2, 0.5)';
      nav.style.borderBottom = '1px solid rgba(255, 26, 74, 0.15)';
    }
  }, { passive: true });
}

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
