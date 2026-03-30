// 1. 모든 멤버 데이터 통합 관리
const members = {
  master: [
    {
      id: 'gguu',
      name: '꾸티뉴',
      rank: 'MASTER',
      img: '/img/gugu.png',
      art: '무한 연산',
      desc: '지-캐슬의 마스터.',
      link: 'https://www.sooplive.com/station/aksen7833',
    },
  ],
  upper: [
    {
      id: 'yamuza',
      name: '야무지',
      sub: '상현의 1',
      rank: '상현 1',
      img: '/img/야무자.png',
      art: '달의 호흡',
      desc: '상현 1위의 검사.',
      link: 'https://www.sooplive.com/station/land4968',
    },
    {
      id: 'enju',
      name: '엔쥬',
      sub: '상현의 2',
      rank: '상현 2',
      img: '/img/엔쥬.png',
      art: '빙결 혈귀술',
      desc: '빙결의 수호자.',
      link: 'https://www.sooplive.com/station/northpole',
    },
    {
      id: 'randa',
      name: '란다',
      sub: '상현의 3',
      rank: '상현 3',
      img: '/img/란다.png',
      art: '파괴살',
      desc: '권술의 달인.',
      link: 'https://www.sooplive.com/station/top6373',
    },
    {
      id: 'sellkey',
      name: '셀키',
      sub: '상현의 4',
      rank: '상현 4',
      img: '/img/셀키.png',
      art: '분신술',
      desc: '분열하는 혈귀.',
      link: 'https://www.sooplive.com/station/sellkey',
    },
    {
      id: 'lika',
      name: '리카',
      sub: '상현의 5',
      rank: '상현 5',
      img: '/img/리카.png',
      art: '항아리 소환',
      desc: '항아리 술사.',
      link: 'https://www.sooplive.com/station/lika07',
    },
    {
      id: 'choelssu',
      name: '철쑤',
      sub: '상현의 6',
      rank: '상현 6',
      img: '/img/철수.png',
      art: '맹독 혈귀술',
      desc: '독의 수호자.',
      link: 'https://www.sooplive.com/station/choelssu',
    },
    {
      id: 'koo',
      name: '구본좌',
      sub: '상현의 6',
      rank: '상현 6',
      img: '/img/r구구구.png',
      art: '피의 낫',
      desc: '낫을 쓰는 혈귀.',
      link: 'https://www.sooplive.com/station/koo2202',
    },
  ],
  lower: [
    {
      id: 'younggam',
      name: '영감',
      rank: 'LOWER 1',
      img: '/img/영감.png',
      art: '하현 1',
      desc: '꿈의 지배자.',
      link: 'https://www.sooplive.com/station/y0unggam',
    },
    {
      id: 'nanana',
      name: '난워니',
      rank: 'LOWER 2',
      img: '/img/나나나.png',
      art: '하현 2',
      desc: '하현의 2위.',
      link: 'https://www.sooplive.com/station/whiteone325',
    },
    {
      id: 'damu',
      name: '다뮤',
      rank: 'LOWER 4',
      img: '/img/다뮤.png',
      art: '하현 4',
      desc: '하현의 4위.',
      link: 'https://www.sooplive.com/station/not15987',
    },
    {
      id: 'ttanttan',
      name: '딴딴2당',
      rank: 'LOWER 5',
      img: '/img/딴딴.png',
      art: '하현 5',
      desc: '하현의 5위.',
      link: 'https://www.sooplive.com/station/dbsk0708',
    },
    {
      id: '초귀요미',
      name: '초귀요미',
      rank: 'LOWER 6',
      img: '/img/초귀.png',
      art: '세라핀',
      desc: '하현의 6위.',
      link: 'https://www.sooplive.com/station/suupercutie',
    },
    {
      id: '밈먀',
      name: '밈먀',
      rank: '',
      img: '/img/밈먀.png',
      art: '밈먀',
      desc: '하현.',
      link: 'https://www.sooplive.com/station/mimmya0203',
    },
    {
      id: '바먀',
      name: '바먀',
      rank: 'LOWER 6',
      img: '/img/바먀.png',
      art: '바먀',
      desc: '하현.',
      link: 'https://www.sooplive.com/station/wooyah21',
    },
  ],
};

// 2. 카드 생성 함수
function createCard(member, isGold = false) {
  return `
        <div class="flip-card">
            <div class="flip-front">
                <div class="portrait">
                    <img src="${member.img}" alt="${member.name}">
                    <div class="rank-overlay ${isGold ? 'gold' : ''}">${member.rank}</div>
                </div>
                <div class="info">
                    <h3 class="${isGold ? 'gold-text' : ''}">${member.name}</h3>
                    <span class="blood-art">${member.sub || member.art}</span>
                </div>
            </div>
            <div class="flip-back">
                <h3 class="gold-text">${member.name}</h3>
                <p style="font-size:0.85rem; color:#888;">${member.desc}</p>
                <span class="click-hint">CLICK FOR RECORD</span>
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
  masterContainer.innerHTML = createCard(members.master[0], true);
  masterContainer.onclick = () => openMemberModal(members.master[0]);

  // 상현 렌더링
  const upperGrid = document.getElementById('upper-grid');
  members.upper.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'flip-container';
    div.innerHTML = createCard(m);
    div.onclick = () => openMemberModal(m);
    upperGrid.appendChild(div);
  });

  // 하현 렌더링
  const lowerGrid = document.getElementById('lower-grid');
  members.lower.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'flip-container';
    div.innerHTML = createCard(m);
    div.onclick = () => openMemberModal(m);
    lowerGrid.appendChild(div);
  });
});

// 4. 모달 기능
function openMemberModal(data) {
  const view = document.getElementById('modal-detail-view');
  const overlay = document.getElementById('memberModal');
  if (!data) return;

  // 모달 내부를 좌우 분할 구조로 변경
  view.innerHTML = `
        <div class="modal-left">
            <img src="${data.img}" alt="${data.name}">
        </div>
        <div class="modal-right">
            <div class="modal-rank">${data.rank}</div>
            <h2>${data.name}</h2>
            <div style="border-top:1px solid #333; margin:20px 0;"></div>
            <p class="modal-desc">
                <b style="color:#eee;">혈귀술:</b> ${data.art}<br><br>
                ${data.desc}
            </p>
            <button class="btn-visit" onclick="window.open('${data.link}')">SOOP STATION</button>
        </div>
    `;

  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.classList.add('active');
  }, 10); // 부드럽게 나타나기
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
