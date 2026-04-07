// 1. 소환할 멤버 데이터 (GGCard 데이터 기반)
const summonPool = {
    ssr: [
        { name: '꾸티뉴', rank: 'MASTER', img: '/grx/img/ggutinho.png', fortune: '무한성의 마스터가 당신을 굽어살핍니다. 오늘은 모든 일이 완벽하게 풀릴 것입니다!' }
    ],
    sr: [
        { name: '야무지', rank: '상현 1', img: '/grx/img/yamuzi.png', fortune: '상현 1의 기운이 깃들었습니다. 랭크전에서 압도적인 승리를 거둘 운명입니다.' },
        { name: '엔쥬', rank: '상현 2', img: '/grx/img/enju.png', fortune: '차분한 빙결의 기운이 마음을 다스려줍니다. 오늘 하루는 실수 없이 완벽할 거예요.' },
        { name: '란다', rank: '상현 3', img: '/grx/img/randa.png', fortune: '파괴살의 투지가 솟구칩니다! 열정적으로 도전하면 무엇이든 이룰 수 있습니다.' },
        { name: '셀키', rank: '상현 4', img: '/grx/img/selky.png', fortune: '분신술처럼 몸이 열 개라도 모자랄 바쁜 하루지만, 성과는 배가 될 것입니다.' },
        { name: '리카', rank: '상현 5', img: '/grx/img/lika.png', fortune: '항아리에서 행운이 쏟아집니다. 뜻밖의 소중한 인연을 만날 수도 있어요.' },
        { name: '철쑤', rank: '상현 6', img: '/grx/img/choelssu.png', fortune: '맹독의 날카로움이 직관력을 높여줍니다. 중요한 결정을 내리기에 최적의 날입니다.' },
        { name: '구본좌', rank: '상현 6', img: '/grx/img/koo.png', fortune: '피의 낫처럼 날카로운 집중력이 발휘됩니다. 오랫동안 고민하던 일이 해결됩니다.' }
    ],
    r: [
        { name: '영감', rank: '하현 1', img: '/grx/img/younggam.png', fortune: '달콤한 꿈같은 하루가 기다립니다. 편안하게 휴식을 취하기 좋은 날입니다.' },
        { name: '난워니', rank: '하현 2', img: '/grx/img/nanana.png', fortune: '기린처럼 멀리 내다보세요. 미래를 위한 계획을 세우면 운이 따를 것입니다.' },
        { name: '다뮤', rank: '하현 4', img: '/grx/img/damu.jpeg', fortune: '장난스러운 행운이 당신을 찾아옵니다. 가벼운 마음으로 하루를 즐기세요.' },
        { name: '딴딴2당', rank: '하현 5', img: '/grx/img/ttanttan.jpeg', fortune: '따뜻한 위로와 칭찬을 받게 될 거예요. 주변 사람들과의 관계가 좋아집니다.' },
        { name: '초귀요미', rank: '하현 6', img: '/grx/img/cho-cutie.png', fortune: '부드러운 카리스마가 빛납니다. 당신의 매력이 주변을 사로잡을 것입니다.' },
        { name: '밈먀', rank: '하현', img: '/grx/img/mimmya.png', fortune: '예상치 못한 웃음이 터지는 유쾌한 하루가 될 것입니다. 비타민 같은 시간입니다.' },
        { name: '바먀', rank: '하현', img: '/grx/img/baamya.png', fortune: '근본 있는 행운이 당신 곁에 머눕니다. 기본에 충실하면 큰 이득이 있습니다.' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const btnSummon = document.getElementById('btnSummon');
    const btnReset = document.getElementById('btnReset'); // 테스트용
    const gachaGate = document.getElementById('gachaGate');
    const summonResult = document.getElementById('summonResult');
    const particlesContainer = document.getElementById('particles');

    // ── 매일 한 번 제한 체크 ──
    const checkDailySummon = () => {
        const lastSummon = localStorage.getItem('lastSummonDate');
        const today = new Date().toDateString();
        
        if (lastSummon === today) {
            const savedMember = JSON.parse(localStorage.getItem('todayMember'));
            showResult(savedMember, true); // 이미 뽑았다면 저장된 결과 바로 표시
            btnSummon.disabled = true;
            btnSummon.innerText = "오늘의 소환 완료";
        }
    };

    // ── 소환 로직 ──
    const performSummon = () => {
        btnSummon.disabled = true;
        gachaGate.classList.add('shaking'); // 문 진동

        // 1. 랜덤 확률 결정
        const rand = Math.random() * 100;
        let selectedRarity = 'r';
        let rarityClass = '';

        if (rand < 5) { selectedRarity = 'ssr'; rarityClass = 'rarity-ssr'; }
        else if (rand < 30) { selectedRarity = 'sr'; rarityClass = 'rarity-sr'; }
        
        const pool = summonPool[selectedRarity];
        const picked = pool[Math.floor(Math.random() * pool.length)];
        picked.rarityClass = rarityClass;

        // 2. 연출 타임라인
        setTimeout(() => {
            gachaGate.classList.remove('shaking');
            gachaGate.classList.add('opened'); // 문 열림
            createExplosion(window.innerWidth / 2, window.innerHeight / 2, 50);

            setTimeout(() => {
                showResult(picked);
                // 결과 저장
                localStorage.setItem('lastSummonDate', new Date().toDateString());
                localStorage.setItem('todayMember', JSON.stringify(picked));
            }, 800);
        }, 1500);
    };

    const showResult = (member, instant = false) => {
        summonResult.innerHTML = `
            <div class="summon-card ${member.rarityClass}">
                <img src="${member.img}" class="card-img" alt="${member.name}">
                <div class="card-body">
                    <div class="card-rank">${member.rank}</div>
                    <div class="card-name">${member.name}</div>
                    <div class="card-fortune">"${member.fortune}"</div>
                </div>
            </div>
        `;
        
        if (instant) {
            gachaGate.style.display = 'none';
            summonResult.classList.add('show', 'instant');
            summonResult.style.opacity = '1';
            summonResult.style.transform = 'scale(1)';
        } else {
            summonResult.classList.add('show');
        }
    };

    btnSummon.addEventListener('click', performSummon);
    gachaGate.addEventListener('click', () => {
        if (!btnSummon.disabled) performSummon();
    });

    // ── 테스트용 리셋 (나중에 삭제 가능) ──
    if(btnReset) {
        btnReset.addEventListener('click', () => {
            localStorage.removeItem('lastSummonDate');
            location.reload();
        });
    }

    checkDailySummon();
});

// 앰비언트 파티클 효과
function createExplosion(x, y, count=15) {
  const container = document.getElementById('particles');
  if(!container) return;
  for(let i=0; i<count; i++) {
    const spark = document.createElement('div');
    spark.classList.add('spark');
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 150;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    spark.style.setProperty('--dx', `${dx}px`);
    spark.style.setProperty('--dy', `${dy}px`);
    container.appendChild(spark);
    setTimeout(() => spark.remove(), 1000);
  }
}
