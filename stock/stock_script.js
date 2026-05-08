(function() {
    const marketGrid = document.getElementById('marketGrid');
    const rankingList = document.getElementById('rankingList');
    const portfolioBox = document.getElementById('portfolioBox');
    const portfolioList = document.getElementById('portfolioList');
    const userNick = document.getElementById('userNick');
    const userBalance = document.getElementById('userBalance');
    const btnLogin = document.getElementById('btnLogin');
    const loginModal = document.getElementById('loginModal');
    const btnConfirm = document.getElementById('btnConfirm');
    const inputId = document.getElementById('inputId');
    const inputPw = document.getElementById('inputPw');
    const inputNick = document.getElementById('inputNick');
    const nickGroup = document.getElementById('nickGroup');

    let currentUser = JSON.parse(localStorage.getItem('grx_stock_user')) || null;
    let currentMarket = [];

    const init = () => {
        updateUserUI();
        fetchMarket();
        fetchRanking();

        // ⏱️ 실시간 업데이트 (60초마다 마켓과 랭킹 자동 갱신 - 서버 한도 보호)
        setInterval(() => {
            // 🛡️ 요금 방어: 유저가 다른 탭을 보거나 창을 내리면 통신 일시정지!
            if (document.hidden) return; 
            
            fetchMarket(true); 
            fetchRanking();
        }, 60000);


        
        btnLogin.onclick = () => {
            if (currentUser) {
                if (confirm('로그아웃 하시겠습니까?')) {
                    localStorage.removeItem('grx_stock_user');
                    location.reload();
                }
            } else {
                loginModal.style.display = 'flex';
            }
        };

        window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = 'none'; };
        btnConfirm.onclick = handleAuth;
    };

    const updateUserUI = () => {
        if (currentUser) {
            userNick.innerText = `👑 ${currentUser.nick}`;
            userBalance.innerText = `₩ ${Number(currentUser.balance).toLocaleString()}`;
            btnLogin.innerText = 'LOGOUT';
            portfolioBox.style.display = 'block';
            renderPortfolio();
        } else {
            userNick.innerText = '로그인 해주세요';
            userBalance.innerText = '₩ 0';
            btnLogin.innerText = 'LOGIN';
            portfolioBox.style.display = 'none';
        }
    };

    const renderPortfolio = () => {
        if (!currentUser || !currentUser.portfolio) return;
        const keys = Object.keys(currentUser.portfolio);
        if (keys.length === 0) {
            portfolioList.innerHTML = '<div style="padding: 10px; text-align: center; opacity: 0.5;">보유 자산이 없습니다.</div>';
            return;
        }

        portfolioList.innerHTML = keys.map(code => {
            const qty = currentUser.portfolio[code];
            const stock = currentMarket.find(s => s.code === code) || { name: code, price: 0 };
            const totalVal = (stock.price || 0) * qty;
            return `
                <div class="rank-item" style="font-size: 0.9rem;">
                    <span><b>${stock.name}</b> (${qty}주)</span>
                    <span style="color:#fff">₩ ${totalVal.toLocaleString()}</span>
                </div>
            `;
        }).join('');
    };

    async function handleAuth() {
        const id = inputId.value.trim();
        const pw = inputPw.value.trim();
        const nick = inputNick.value.trim();
        if (!id || !pw) return alert('아이디와 비밀번호를 입력해주세요.');

        try {
            const url = `${CONFIG.STOCK_PROXY}?action=login&id=${id}&pw=${pw}${nick ? '&nick='+nick : ''}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.error) alert(data.error);
            else if (data.needNick) {
                alert('첫 가입입니다! 닉네임을 입력하고 다시 확인을 눌러주세요.');
                nickGroup.style.display = 'block';
            } else {
                currentUser = data.user;
                currentUser.pw = pw; 
                localStorage.setItem('grx_stock_user', JSON.stringify(currentUser));
                location.reload();
            }
        } catch (e) { alert('서버 연결 실패'); }
    }

    async function fetchMarket(isSilent = false) {
        try {
            const res = await fetch(`${CONFIG.STOCK_PROXY}?action=getMarket`);
            currentMarket = await res.json();

            // 📈 가격이 높은 순으로 정렬 (내림차순)
            currentMarket.sort((a, b) => b.price - a.price);

            // 사용자가 입력 중이던 수량 백업 (초기화 방지)
            const inputValues = {};
            document.querySelectorAll('input[type="number"]').forEach(input => {
                inputValues[input.id] = input.value;
            });

            marketGrid.innerHTML = currentMarket.map(c => `
                <div class="stock-card">
                    <div class="stock-info">
                        <div class="stock-icon">${c.code[0]}</div>
                        <div>
                            <div class="stock-name">${c.name}</div>
                            <div class="stock-code">${c.code}/KRW</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="stock-price-area">
                            <div class="price">₩ ${Number(c.price).toLocaleString()}</div>
                            <div class="change ${c.change >= 0 ? 'up' : 'down'}">${c.change >= 0 ? '▲' : '▼'} ${Math.abs(c.change)}%</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                            <input type="number" id="qty_${c.code}" value="1" min="1" style="width: 55px; text-align: center; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; padding: 3px; font-weight: bold;">
                            <div style="display: flex; gap: 5px;">
                                <button onclick="window.tradeStock('buy', '${c.code}', '${c.name}', ${c.price})" style="padding: 5px 10px; border-radius: 4px; background: #ff4d4d; color: white; border:none; font-size: 0.75rem; cursor:pointer; font-weight:bold;">매수</button>
                                <button onclick="window.tradeStock('sell', '${c.code}', '${c.name}', ${c.price})" style="padding: 5px 10px; border-radius: 4px; background: #4d79ff; color: white; border:none; font-size: 0.75rem; cursor:pointer; font-weight:bold;">매도</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // 입력 중이던 수량 복구
            Object.keys(inputValues).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = inputValues[id];
            });

            if (currentUser) renderPortfolio();
        } catch (e) { 
            if (!isSilent) marketGrid.innerHTML = '<div style="opacity:0.5; padding:20px;">마켓 로드 실패</div>'; 
        }
    }

    window.tradeStock = async (type, code, name, price) => {
        if (!currentUser) return alert('로그인 후 이용 가능합니다.');
        
        const qtyInput = document.getElementById(`qty_${code}`);
        const amount = parseInt(qtyInput.value);
        if (!amount || isNaN(amount) || amount <= 0) return alert('올바른 수량을 입력해주세요.');

        const confirmMsg = `${name} ${amount}주를 ₩ ${(price * amount).toLocaleString()}에 ${type === 'buy' ? '매수' : '매도'}하시겠습니까?`;
        if (!confirm(confirmMsg)) return;

        try {
            const pw = currentUser.pw; 
            if (!pw) {
                alert('세션이 만료되었거나 암호가 없습니다. 다시 로그인해주세요!');
                localStorage.removeItem('grx_stock_user');
                location.reload();
                return;
            }

            const url = `${CONFIG.STOCK_PROXY}?action=trade&id=${currentUser.id}&pw=${pw}&type=${type}&code=${code}&amount=${amount}`;
            
            const res = await fetch(url);
            const data = await res.json();

            if (data.error) alert(data.error);
            else {
                alert(`${type === 'buy' ? '매수' : '매도'} 완료!`);
                currentUser.balance = data.balance;
                currentUser.portfolio = data.portfolio;
                localStorage.setItem('grx_stock_user', JSON.stringify(currentUser));
                updateUserUI();
                fetchRanking();
                fetchMarket(true); // 거래 직후 시장/내 가방 갱신
            }
        } catch (e) { alert('거래 처리 실패'); }
    };

    async function fetchRanking() {
        try {
            const res = await fetch(`${CONFIG.STOCK_PROXY}?action=getRanking`);
            const ranks = await res.json();
            
            if (!ranks || ranks.length === 0) {
                rankingList.innerHTML = '<div style="opacity:0.5; padding:20px; text-align:center;">아직 등록된 랭커가 없습니다.</div>';
                return;
            }

            rankingList.innerHTML = ranks.map((r, i) => `
                <div class="rank-item">
                    <span class="rank-nick">${i + 1}. ${r.nick}</span>
                    <span class="rank-val">₩ ${Number(r.balance).toLocaleString()}</span>
                </div>
            `).join('');
        } catch (e) { rankingList.innerHTML = '<div style="opacity:0.5; padding:20px; text-align:center;">랭킹 로드 실패</div>'; }
    }

    init();
})();
