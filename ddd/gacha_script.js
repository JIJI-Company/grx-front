// 1. 소환할 멤버 데이터 (GGCard 데이터 기반)
const summonPool = {
    ssr: [
        { name: '꾸티뉴', rank: 'MASTER', img: '../img2/ggutinho.png', fortune: '무한성의 마스터가 당신을 굽어살핍니다. 오늘은 모든 일이 완벽하게 풀릴 것입니다!' }
    ],
    sr: [
        { name: '야무지', rank: '상현 1', img: '../img2/yamuzi.jpg', fortune: '상현 1의 기운이 깃들었습니다. 랭크전에서 압도적인 승리를 거둘 운명입니다.' },
        { name: '엔쥬', rank: '상현 2', img: '../img2/enju.jpg', fortune: '차분한 빙결의 기운이 마음을 다스려줍니다. 오늘 하루는 실수 없이 완벽할 거예요.' },
        { name: '란다', rank: '상현 3', img: '../img2/randa.jpg', fortune: '파괴살의 투지가 솟구칩니다! 열정적으로 도전하면 무엇이든 이룰 수 있습니다.' },
        { name: '리카', rank: '상현 5', img: '../img2/lika.jpg', fortune: '항아리에서 행운이 쏟아집니다. 뜻밖의 소중한 인연을 만날 수도 있어요.' }
    ],
    r: [
        { name: '난워니', rank: '하현 2', img: '../img2/nanwoni.png', fortune: '기린처럼 멀리 내다보세요. 미래를 위한 계획을 세우면 운이 따를 것입니다.' },
        { name: '다뮤', rank: '하현 4', img: '../img2/damu.png', fortune: '장난스러운 행운이 당신을 찾아옵니다. 가벼운 마음으로 하루를 즐기세요.' },
        { name: '딴딴2당', rank: '하현 5', img: '../img2/ttanttan.png', fortune: '따뜻한 위로와 칭찬을 받게 될 거예요. 주변 사람들과의 관계가 좋아집니다.' },
        { name: '초귀요미', rank: '하현 6', img: '../img2/chogua.png', fortune: '부드러운 카리스마가 빛납니다. 당신의 매력이 주변을 사로잡을 것입니다.' },
        { name: '바먀', rank: '하현', img: '../img2/baamya.png', fortune: '근본 있는 행운이 당신 곁에 머눕니다. 기본에 충실하면 큰 이득이 있습니다.' },
        { name: '서라0', rank: '하현', img: '../img2/seora0.jpg', fortune: '비밀스러운 성장이 기대되는 하루입니다. 새로운 가능성을 발견하게 됩니다.' },
        { name: '임민트', rank: '하현', img: '../img/mint.png', fortune: '상쾌한 바람처럼 새로운 기운이 불어옵니다. 맑은 마음으로 하루를 시작하세요.' },
        { name: '김옥독', rank: '하현', img: '../img/okdok.png', fortune: '옥독해옥독해! 오늘은 왠지 끈기 있게 밀어붙이면 좋은 결과가 있을 거예요.' },
        { name: '냥쏘', rank: '하현', img: '../img/nangsso.png', fortune: '고양이처럼 유연하게 대처하세요. 생각지 못한 곳에서 행운이 찾아옵니다.' },
        { name: '윤타미', rank: '하현', img: '../img/tami.png', fortune: '차분하게 자신만의 속도로 나아가세요. 당신의 진심이 결실을 맺을 날입니다.' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const btnSummon = document.getElementById('btnSummon');
    const btnSummon5 = document.getElementById('btnSummon5');
    const gachaGate = document.getElementById('gachaGate');
    const summonResult = document.getElementById('summonResult');
    const particlesContainer = document.getElementById('particles');

    const performSummon = (count = 1) => {
        if (btnSummon.disabled) return;
        summonResult.classList.remove('show', 'instant', 'multi');
        if (count > 1) summonResult.classList.add('multi');
        gachaGate.classList.remove('opened'); gachaGate.style.display = 'block';
        btnSummon.disabled = true; if (btnSummon5) btnSummon5.disabled = true;
        btnSummon.innerText = "소환 중..."; if (btnSummon5) btnSummon5.innerText = "소환 중...";
        gachaGate.classList.add('shaking');
        setTimeout(() => {
            gachaGate.classList.remove('shaking'); gachaGate.classList.add('opened');
            createExplosion(window.innerWidth / 2, window.innerHeight / 2, 50);
            setTimeout(() => {
                const cardsToSave = [];
                const allMembers = [];
                Object.keys(summonPool).forEach(rarity => {
                    summonPool[rarity].forEach(member => {
                        allMembers.push({ ...member, rarity });
                    });
                });

                for (let i = 0; i < count; i++) {
                    // 1. 모든 멤버 중 동일 확률로 선택 (1/전체인원)
                    const pickedBase = allMembers[Math.floor(Math.random() * allMembers.length)];
                    const picked = { ...pickedBase };
                    picked.rarityClass = `rarity-${picked.rarity}`;

                    // 2. 성급 확률 복구 (1성 70%, 2성 20%, 3성 8%, 4성 2%)
                    const randStar = Math.random() * 100;
                    let earnedStars = 1;
                    if (randStar < 2) earnedStars = 4;
                    else if (randStar < 10) earnedStars = 3;
                    else if (randStar < 30) earnedStars = 2;

                    cardsToSave.push({ 
                        ...picked, id: Date.now() + i, 
                        baseId: picked.name + '_' + picked.rank,
                        starRank: earnedStars 
                    });
                }
                showResult(cardsToSave);
                cardsToSave.forEach(c => addToInventory(c));
                btnSummon.disabled = false; btnSummon.innerText = "1회 소환";
                if (btnSummon5) { btnSummon5.disabled = false; btnSummon5.innerText = "5연속 소환"; }
            }, 800);
        }, 1500);
    };

    const addToInventory = (card) => {
        let data = JSON.parse(localStorage.getItem('grx_inventory_v2')) || { items: [], lastUpdated: Date.now() };
        data.items.push(card); data.lastUpdated = Date.now();
        localStorage.setItem('grx_inventory_v2', JSON.stringify(data));
    };

    const showResult = (members, instant = false) => {
        let htmlStr = '';
        members.forEach(member => {
            let starsHtml = ''; const rankValue = member.starRank || 1;
            for(let i=0; i<rankValue; i++) starsHtml += '★';
            htmlStr += `
                <div class="summon-card ${member.rarityClass}" style="box-shadow: ${rankValue >= 5 ? '0 0 30px #ff1a4a, inset 0 0 20px #ff1a4a' : (rankValue >= 3 ? '0 0 20px #ffd700' : 'none')};">
                    <img src="${member.img}" class="card-img" alt="${member.name}">
                    <div class="card-body">
                        <div style="color:${rankValue >= 5 ? '#ff1a4a' : '#ffd700'}; font-size:1.5rem; text-shadow:0 0 10px rgba(0,0,0,0.8); margin-bottom:10px;">${starsHtml}</div>
                        <div class="card-rank">${member.rank}</div>
                        <div class="card-name">${member.name}</div>
                        <div class="card-fortune">"${member.fortune}"</div>
                    </div>
                </div>
            `;
        });
        summonResult.innerHTML = htmlStr;
        if (instant) { gachaGate.style.display = 'none'; summonResult.classList.add('show', 'instant'); summonResult.style.opacity = '1'; summonResult.style.transform = 'scale(1)'; }
        else { summonResult.classList.add('show'); }
    };
    btnSummon.addEventListener('click', () => performSummon(1));
    if (btnSummon5) btnSummon5.addEventListener('click', () => performSummon(5));
});

function createExplosion(x, y, count=15) {
  const container = document.getElementById('particles'); if(!container) return;
  for(let i=0; i<count; i++) {
    const spark = document.createElement('div'); spark.classList.add('spark');
    const angle = Math.random() * Math.PI * 2; const distance = 50 + Math.random() * 150;
    const dx = Math.cos(angle) * distance; const dy = Math.sin(angle) * distance;
    spark.style.left = x + 'px'; spark.style.top = y + 'px';
    spark.style.setProperty('--dx', `${dx}px`); spark.style.setProperty('--dy', `${dy}px`);
    container.appendChild(spark); setTimeout(() => spark.remove(), 1000);
  }
}
