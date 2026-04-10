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
      id: 'randa',
      name: '란다',
      sub: '상현의 3',
      rank: '상현 3',
      img: 'img/randa.png',
      art: '파괴살',
      desc: '권술의 달인.',
      keywords: '#꾸최란 #란부장 #금붕어',
      birthday: '04.20',
      mbti: 'ISTP',
      tmi: '카페 맛집 탐방러, 별풍선과 누워있기',
      color: '#F28C2F',
      link: 'https://www.sooplive.com/station/top6373',
    },
    {
      id: 'sellkey',
      name: '셀키',
      sub: '상현의 4',
      rank: '상현 4',
      img: 'img/selky.png',
      art: '분신술',
      desc: '분열하는 혈귀.',
      keywords: '#셀쪽이 #해파리단',
      birthday: '02.22',
      mbti: 'ENTJ',
      tmi: '잘 삐지지만 컨텐츠에 진심인 열정파',
      color: '#87CEEB',
      link: 'https://www.sooplive.com/station/sellkey',
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
    {
      id: 'choelssu',
      name: '철쑤',
      sub: '상현의 6',
      rank: '상현 6',
      img: 'img/choelssu.png',
      art: '맹독 혈귀술',
      desc: '독의 수호자.',
      keywords: '#하마 #철쑤세미',
      birthday: '05.05',
      mbti: 'INTP',
      tmi: '음주가무와 돈을 사랑하는 자유 영혼',
      color: '#8A4B5A',
      link: 'https://www.sooplive.com/station/choelssu',
    },
    {
      id: 'koo',
      name: '구본좌',
      sub: '상현의 6',
      rank: '상현 6',
      img: 'img/koo.png',
      art: '피의 낫',
      desc: '낫을 쓰는 혈귀.',
      keywords: '#본이루 #독거노인',
      birthday: '06.09',
      mbti: 'ISFJ',
      tmi: '댄스와 장보기가 취미인 버혐좌(?)',
      color: '#7AA07A',
      link: 'https://www.sooplive.com/station/koo2202',
    },
  ],
  lower: [
    {
      id: 'younggam',
      name: '영감',
      rank: 'LOWER 1',
      img: 'img/younggam.png',
      art: '하현 1',
      desc: '꿈의 지배자.',
      keywords: '#나무늘보 #영감탱',
      birthday: '09.17',
      mbti: 'INTP',
      tmi: '로판 웹툰 매니아, 반려견 칸쵸&쿠키',
      color: '#9A9A9A',
      link: 'https://www.sooplive.com/station/y0unggam',
    },
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
      art: '하현 5',
      desc: '하현의 5위.',
      keywords: '#오독이 #말랑이',
      birthday: '07.08',
      mbti: 'INFP',
      tmi: '칭찬에 약하고 도움이 되고 싶은 에겐',
      color: '#FFB6C1',
      link: 'https://www.sooplive.com/station/dbsk0708',
    },
    {
      id: 'cho-cutie',
      name: '초귀요미',
      rank: 'LOWER 6',
      img: 'img/cho-cutie.png',
      art: '하현 6',
      desc: '하현의 6위.',
      keywords: '#위선자 #아잉이',
      birthday: '12.25',
      mbti: 'INTP',
      tmi: '자작곡 쓰는 배그 여전사 (소고기 좋아함)',
      color: '#FFD700',
      link: 'https://www.sooplive.com/station/suupercutie',
    },
    {
      id: 'mimmya',
      name: '밈먀',
      rank: 'LOWER',
      img: 'img/mimmya.png',
      art: '밈먀',
      desc: '.',
      keywords: '#밈재앙 #누렁이',
      birthday: '11.22',
      mbti: 'ESFJ',
      tmi: '팬들 괴롭히기가 취미인 마친련(?)',
      color: '#D2B48C',
      link: 'https://www.sooplive.com/station/mimmya0203',
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
      art: '임시 혈귀술',
      desc: '신입 혈귀 서라0입니다.',
      keywords: '#신입 #서라0',
      birthday: '??.??',
      mbti: '????',
      tmi: '현재 정보를 업데이트 중입니다.',
      color: '#BFC9D6',
      link: 'https://www.sooplive.com/station/o0opha',
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
  const isDark = luminance < 80; // ✅ 철쑤처럼 너무 어두운 색상 감지
  
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
  setTimeout(() => {
    overlay.classList.add('active');
  }, 10);
}

function closeMemberModal() {
  const overlay = document.getElementById('memberModal');
  overlay.classList.remove('active');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 400); // 애니메이션 시간 대기
}
// 배경 클릭 시 닫기
window.onclick = (e) => {
  if (e.target == document.getElementById('memberModal')) closeMemberModal();
};
