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
  { author: "GRVR", desc: "고퀄리티 스페셜 - 꾸티뉴", img: "../img2/꾸티뉴.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 난워니", img: "../img2/난워니.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 다뮤", img: "../img2/다뮤.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 딴딴", img: "../img2/딴딴.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 란다", img: "../img2/란다.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 리카", img: "../img2/리카.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 밈먀", img: "../img2/밈먀.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 바먀", img: "../img2/바먀.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 구본좌", img: "../img2/본좌.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 셀키", img: "../img2/셀키.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 야주미", img: "../img2/야주미.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 엔쥬", img: "../img2/엔쥬.jpg" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 영감", img: "../img2/영감.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 초구ㅏ", img: "../img2/초구ㅏ.png" },
  { author: "GRVR", desc: "고퀄리티 스페셜 - 서라0", img: "../img2/서라0.jpg" }
];
let galleryData = [];


// ── 페이지 초기화 분기 처리 ──
document.addEventListener('DOMContentLoaded', async () => {
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
  
  // 3. GALLERY 초기화
  const galleryMasonry = document.getElementById('galleryMasonry');
  if(galleryMasonry) {
    initGallery(galleryMasonry);
  }
});


// ════════════════════════════════════
// [1] GUESTBOOK 로직
// ════════════════════════════════════
function spawnTalisman(author, target, text, delayMs = 0) {
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

  // 🚪 미닫이문(Fusuma) 애니메이션 트리거 (IntersectionObserver)
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // 한 번 열리면 계속 열려있게 하려면 unobserve (취향껏 조절)
        // observer.unobserve(entry.target); 
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-item').forEach(item => {
    observer.observe(item);
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
    
    const link = art.URL || art.url || art.link || '#';
    const thumb = art.Thumbnail || art.thumbnail || art.img || '../img/ggu_title.jpg';
    const author = art.Author || art.author || 'G-CASTLE';
    const desc = art.Description || art.description || art.desc || '무한성 아카이브';

    if (link !== '#') {
      item.onclick = () => window.open(link, '_blank');
      item.style.cursor = 'pointer';
    }
    
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transitionDelay = `${idx * 0.03}s`;
    
    item.innerHTML = `
      <div class="gallery-wrapper" style="width: 100%; min-height: 200px; background: rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center;">
        <img src="${thumb}" alt="${author}" 
             style="width: 100%; display: block; border-radius: 4px; transition: transform 0.5s ease;" 
             onerror="this.src='../img/ggu_title.jpg'; this.style.opacity='0.4'; this.nextElementSibling.style.display='flex'">
        <div class="img-error-hint" style="position: absolute; display: none; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-size: 0.7rem; text-align: center; padding: 10px;">
           <span style="font-size: 1.5rem; margin-bottom: 5px;">🖼️</span>
           <span>이미지 보호 중<br>(클릭 시 원본 확인)</span>
        </div>
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

document.addEventListener('click', (e) => {
  if (e.target.closest('.talisman-card') || e.target.closest('.guestbook-interface') || e.target.closest('.news-card') || e.target.closest('.gallery-item')) return;
  createExplosion(e.clientX, e.clientY, 8);
});

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
