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

    let currentUser = JSON.parse(sessionStorage.getItem('grx_stock_user')) || JSON.parse(localStorage.getItem('grx_stock_user')) || null;
    let currentMarket = [];
    let prevPrices = {}; 
    let avgCostMap = JSON.parse(localStorage.getItem('grx_stock_avgcost')) || {};
    let selectedStock = null; // 현재 선택된 종목 코드

    // 🔐 AUTH & SESSION SYNC
    async function syncSession() {
        if (!currentUser || !currentUser.id || !currentUser.pw) return;
        try {
            const url = `${CONFIG.STOCK_PROXY}?action=login&id=${encodeURIComponent(currentUser.id)}&pw=${encodeURIComponent(currentUser.pw)}&_t=${Date.now()}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.error && data.user) {
                currentUser = { ...data.user, pw: currentUser.pw };
                sessionStorage.setItem('grx_stock_user', JSON.stringify(currentUser));
                if (data.user.avgCost) {
                    avgCostMap = data.user.avgCost;
                    saveAvgCost();
                }
                updateUserUI();
            }
        } catch (e) {}
    }

    function saveAvgCost() {
        localStorage.setItem('grx_stock_avgcost', JSON.stringify(avgCostMap));
    }

    // ════════════════════════════════════
    // 🔔 TOAST 알림 시스템
    // ════════════════════════════════════
    function showToast(title, msg = '', type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) { alert(title + (msg ? '\n' + msg : '')); return; }

        const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '💡'}</span>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
            </div>
        `;
        container.appendChild(toast);

        // 자동 제거
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 320);
        }, duration);
    }

    // ════════════════════════════════════
    // 🔐 로그아웃 확인 (confirm 대체)
    // ════════════════════════════════════
    function showConfirmToast(msg, onConfirm) {
        const container = document.getElementById('toastContainer');
        if (!container) { if (confirm(msg)) onConfirm(); return; }

        const toast = document.createElement('div');
        toast.className = 'toast info';
        toast.style.maxWidth = '320px';
        toast.innerHTML = `
            <div class="toast-body" style="width:100%;">
                <div class="toast-title" style="margin-bottom:10px;">⚠️ ${msg}</div>
                <div style="display:flex;gap:8px;">
                    <button id="tc-yes" style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--down);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;">확인</button>
                    <button id="tc-no" style="flex:1;padding:8px;border:1px solid var(--border-hover);border-radius:8px;background:transparent;color:var(--text-dim);font-weight:700;cursor:pointer;font-family:inherit;">취소</button>
                </div>
            </div>
        `;
        container.appendChild(toast);

        toast.querySelector('#tc-yes').onclick = () => { toast.remove(); onConfirm(); };
        toast.querySelector('#tc-no').onclick = () => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 320); };
    }

    // ════════════════════════════════════
    // 🎬 INIT
    // ════════════════════════════════════
    const init = async () => {
        updateUserUI();
        Promise.all([fetchMarket(), fetchRanking()]);

        setInterval(() => {
            if (document.hidden) return;
            fetchMarket(true);
            fetchRanking();
        }, 60000);

        btnLogin.onclick = () => {
            if (currentUser) {
                showConfirmToast('로그아웃 하시겠습니까?', () => {
                    localStorage.removeItem('grx_stock_user');
                    currentUser = null;
                    updateUserUI();
                    showToast('로그아웃 완료', '', 'info');
                });
            } else {
                loginModal.style.display = 'flex';
            }
        };

        window.onclick = (e) => { if (e.target === loginModal) loginModal.style.display = 'none'; };
        btnConfirm.onclick = handleAuth;
    };

    // ════════════════════════════════════
    // 👤 USER UI
    // ════════════════════════════════════
    const updateUserUI = () => {
        const dot = document.getElementById('userDot');
        if (currentUser) {
            userNick.innerText = currentUser.nick;
            userBalance.innerText = `₩ ${Number(currentUser.balance).toLocaleString()}`;
            btnLogin.innerText = 'LOGOUT';
            if (dot) dot.classList.add('online');
            portfolioBox.style.display = 'block';
            renderPortfolio();
            updateTotalAsset();
        } else {
            userNick.innerText = '로그인 해주세요';
            userBalance.innerText = '₩ 0';
            btnLogin.innerText = 'LOGIN';
            if (dot) dot.classList.remove('online');
            const totalChip = document.getElementById('totalAssetChip');
            if (totalChip) totalChip.style.display = 'none';
            portfolioBox.style.display = 'none';
        }
    };

    // 총 자산 = 잔고 + 주식 평가액 (시세 로드 후 재계산 가능)
    const updateTotalAsset = () => {
        if (!currentUser) return;
        let stockVal = 0;
        if (currentUser.portfolio) {
            Object.keys(currentUser.portfolio).forEach(code => {
                const qty = currentUser.portfolio[code];
                const s = currentMarket.find(x => x.code === code);
                if (s) stockVal += s.price * qty;
            });
        }
        const totalChip = document.getElementById('totalAssetChip');
        const totalValEl = document.getElementById('totalAssetVal');
        if (totalChip) totalChip.style.display = 'block';
        if (totalValEl) totalValEl.innerText = `₩ ${(Number(currentUser.balance) + stockVal).toLocaleString()}`;
    };

    const renderPortfolio = () => {
        if (!currentUser || !currentUser.portfolio) return;
        const keys = Object.keys(currentUser.portfolio);
        const totalEl = document.getElementById('portfolioTotal');

        if (keys.length === 0) {
            portfolioList.innerHTML = '<div class="empty-state">보유 자산이 없습니다.</div>';
            if (totalEl) totalEl.innerText = '₩ 0';
            return;
        }

        let totalVal = 0;
        let totalCost = 0;
        portfolioList.innerHTML = keys.map(code => {
            const qty = currentUser.portfolio[code];
            const stock = currentMarket.find(s => s.code === code) || { name: code, price: 0 };
            const curPrice = stock.price || 0;
            const val = curPrice * qty;
            totalVal += val;

            const avgCost = avgCostMap[code] || 0;
            const costTotal = avgCost * qty;
            totalCost += costTotal;
            const pnl = val - costTotal;
            const pnlPct = avgCost > 0 ? ((curPrice - avgCost) / avgCost * 100) : 0;
            const isUp = pnl >= 0;
            const pnlColor = isUp ? 'var(--up)' : 'var(--down)';
            const pnlBg = isUp ? 'var(--up-dim)' : 'var(--down-dim)';
            const pnlArrow = isUp ? '▲' : '▼';
            const pnlSign = isUp ? '+' : '';

            const avgCostLine = avgCost > 0
                ? `<div class="port-avg">평균단가 ₩ ${avgCost.toLocaleString()}</div>`
                : '';
            const pnlBadge = avgCost > 0
                ? `<div class="port-pnl" style="background:${pnlBg}; color:${pnlColor};">
                        ${pnlArrow} ${pnlSign}${Math.abs(pnl).toLocaleString()} (${pnlSign}${pnlPct.toFixed(1)}%)
                   </div>`
                : '';

            return `
                <div class="portfolio-item">
                    <div>
                        <div class="port-name">${stock.name}</div>
                        <div class="port-qty">${qty}주 보유</div>
                        ${avgCostLine}
                    </div>
                    <div style="text-align:right;">
                        <div class="port-val">₩ ${val.toLocaleString()}</div>
                        ${pnlBadge}
                    </div>
                </div>
            `;
        }).join('');

        if (totalEl) {
            const totalPnl = totalVal - totalCost;
            const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost * 100) : 0;
            const isUp = totalPnl >= 0;
            const sign = isUp ? '+' : '';
            const arrow = isUp ? '▲' : '▼';
            const color = isUp ? 'var(--up)' : 'var(--down)';
            totalEl.innerHTML = `₩ ${totalVal.toLocaleString()}
                <div style="font-size:0.75rem; color:${color}; margin-top:4px; font-weight:700;">
                    ${arrow} ${sign}${Math.abs(totalPnl).toLocaleString()} (${sign}${totalPnlPct.toFixed(1)}%)
                </div>`;
        }
    };

    // ════════════════════════════════════
    // 🔐 LOGIN / AUTH
    // ════════════════════════════════════
    async function handleAuth() {
        const id = inputId.value.trim();
        const pw = inputPw.value.trim();
        const nick = inputNick.value.trim();

        if (!id || !pw) return showToast('입력 오류', '아이디와 비밀번호를 입력해주세요.', 'error');
        if (!/[a-zA-Z\u3131-\u314e\uac00-\ud7a3]/.test(pw)) {
            return showToast('비밀번호 규칙', '영문 또는 한글을 반드시 포함해주세요. (예: star123)', 'warning');
        }

        const originalText = btnConfirm.innerText;
        btnConfirm.disabled = true;
        btnConfirm.innerText = '처리 중...';

        try {
            const encodedId = encodeURIComponent(id);
            const encodedPw = encodeURIComponent(pw);
            const encodedNick = nick ? `&nick=${encodeURIComponent(nick)}` : '';
            const url = `${CONFIG.STOCK_PROXY}?action=login&id=${encodedId}&pw=${encodedPw}${encodedNick}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.error) {
                if (data.error.includes('비밀번호')) {
                    showToast('인증 실패', `'${id}' 아이디의 비밀번호가 틀렸습니다.`, 'error', 4000);
                } else {
                    showToast('오류', data.error, 'error');
                }
            } else if (data.needNick) {
                showToast('첫 가입!', '닉네임을 입력하고 다시 확인을 눌러주세요.', 'info', 4000);
                nickGroup.style.display = 'block';
                inputNick.focus();
            } else {
                const user = data.user;
                const userData = { ...user, id: user.id || id, pw };
                localStorage.setItem('grx_stock_user', JSON.stringify(userData));

                loginModal.style.display = 'none';
                location.reload();
            }
        } catch (e) {
            showToast('연결 실패', '서버에 접근할 수 없습니다.', 'error');
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.innerText = originalText;
        }
    }

    // ════════════════════════════════════
    // 📈 MARKET
    // ════════════════════════════════════
    async function fetchMarket(isSilent = false) {
        const cached = localStorage.getItem('grx_stock_market');
        if (cached && !currentMarket.length) {
            currentMarket = JSON.parse(cached);
            renderMarketUI();
        }

        try {
            const res = await fetch(`${CONFIG.STOCK_PROXY}?action=getMarket`);
            const newData = await res.json();
            if (Array.isArray(newData)) {
                currentMarket = newData;
                localStorage.setItem('grx_stock_market', JSON.stringify(currentMarket));
                renderMarketUI();
            }
        } catch (e) {
            if (!isSilent && !currentMarket.length) {
                marketGrid.innerHTML = '<div class="empty-state">마켓 로드 실패</div>';
            }
        }
    }

    function renderMarketUI() {
        if (!currentMarket.length) return;
        currentMarket.sort((a, b) => b.price - a.price);

        const inputValues = {};
        document.querySelectorAll('.qty-inp').forEach(input => {
            inputValues[input.id] = input.value;
        });

        marketGrid.innerHTML = currentMarket.map(c => `
            <div class="stock-card" id="card_${c.code}">
                <div class="stock-left">
                    <div class="stock-avatar">
                        <img src="../img/stock_avatars/${c.code.toUpperCase()}.png" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">
                        <span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center;">${c.code[0]}</span>
                    </div>
                    <div>
                        <div class="stock-name">${c.name}</div>
                        <div class="stock-code-label">${c.code} / KRW</div>
                    </div>
                </div>
                <div class="stock-middle"></div>
                <div class="stock-right">
                    <div class="price-block">
                        <div class="price-val">₩ ${Number(c.price).toLocaleString()}</div>
                        <div class="price-chg ${c.change >= 0 ? 'up' : 'down'}">
                            ${c.change >= 0 ? '▲' : '▼'} ${Math.abs(c.change)}%
                        </div>
                    </div>
                    <div class="trade-block">
                        <div class="qty-row">
                            <span class="qty-label">수량</span>
                            <input type="number" class="qty-inp" id="qty_${c.code}" value="1" min="1">
                        </div>
                        <div class="trade-btns">
                            <button class="btn-trade buy" onclick="window.tradeStock('buy','${c.code}','${c.name}',${c.price})">매수</button>
                            <button class="btn-trade sell" onclick="window.tradeStock('sell','${c.code}','${c.name}',${c.price})">매도</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        Object.keys(inputValues).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = inputValues[id];
        });

        // 티커 업데이트
        const ticker = document.getElementById('tickerBar');
        if (ticker) {
            ticker.innerHTML = currentMarket.map(c => `
                <div class="ticker-item">
                    <span class="ticker-code">${c.code}</span>
                    <span class="ticker-val">₩${Number(c.price).toLocaleString()}</span>
                    <span class="ticker-chg ${c.change >= 0 ? 'up' : 'down'}">${c.change >= 0 ? '+' : ''}${c.change}%</span>
                </div>
            `).join('<span style="color:var(--border-hover);font-size:0.7rem;">│</span>');
        }

        if (currentUser) {
            renderPortfolio();
            updateTotalAsset(); // 시세 로드 완료 후 총 자산 재계산
        }
    }

    // ════════════════════════════════════
    // 💹 TRADE
    // ════════════════════════════════════
    window.tradeStock = async (type, code, name, price) => {
        if (!currentUser) return showToast('로그인 필요', '로그인 후 이용 가능합니다.', 'warning');

        const qtyInput = document.getElementById(`qty_${code}`);
        const amount = parseInt(qtyInput.value);
        if (!amount || isNaN(amount) || amount <= 0) return showToast('입력 오류', '올바른 수량을 입력해주세요.', 'error');

        const total = (price * amount).toLocaleString();
        const action = type === 'buy' ? '매수' : '매도';

        showConfirmToast(`${name} ${amount}주 ${action} — ₩ ${total}`, async () => {
            try {
                const pw = currentUser.pw;
                if (!pw) {
                    showToast('세션 만료', '다시 로그인해주세요.', 'error');
                    localStorage.removeItem('grx_stock_user');
                    currentUser = null;
                    updateUserUI();
                    return;
                }

                const encodedId = encodeURIComponent(currentUser.id);
                const encodedPw = encodeURIComponent(pw);
                const res = await fetch(`${CONFIG.STOCK_PROXY}?action=trade&id=${encodedId}&pw=${encodedPw}&type=${type}&code=${code}&amount=${amount}`);
                const data = await res.json();

                if (data.error) {
                    showToast('거래 실패', data.error, 'error');
                } else {
                    const emoji = type === 'buy' ? '📈' : '📉';
                    showToast(
                        `${emoji} ${action} 완료!`,
                        `${name} ${amount}주 · ₩ ${total}`,
                        'success',
                        4000
                    );
                    if (type === 'buy') {
                        const oldQty = currentUser.portfolio[code] || 0;
                        const oldAvg = avgCostMap[code] || 0;
                        const newQty = oldQty + amount;
                        const newAvg = ((oldAvg * oldQty) + (price * amount)) / newQty;
                        avgCostMap[code] = Math.round(newAvg);
                    } else {
                        const oldQty = currentUser.portfolio[code] || 0;
                        const newQty = oldQty - amount;
                        if (newQty <= 0) {
                            delete currentUser.portfolio[code];
                            delete avgCostMap[code];
                        } else {
                            currentUser.portfolio[code] = newQty;
                        }
                    }
                    saveAvgCost();
                    currentUser.balance = data.balance;
                    currentUser.portfolio = data.portfolio;
                    currentUser.avgCost = data.avgCost || avgCostMap; 
                    localStorage.setItem('grx_stock_user', JSON.stringify(currentUser));
                    sessionStorage.setItem('grx_stock_user', JSON.stringify(currentUser));
                    updateUserUI();
                    fetchRanking();
                    fetchMarket(true);
                }
            } catch (e) {
                showToast('연결 실패', '거래 처리 중 오류가 발생했습니다.', 'error');
            }
        });
    };

    // ════════════════════════════════════
    // 🏆 RANKING
    // ════════════════════════════════════
    async function fetchRanking() {
        const cached = localStorage.getItem('grx_stock_ranking');
        if (cached && !rankingList.children.length) {
            renderRankingUI(JSON.parse(cached));
        }

        try {
            const res = await fetch(`${CONFIG.STOCK_PROXY}?action=getRanking`);
            const ranks = await res.json();
            if (Array.isArray(ranks)) {
                localStorage.setItem('grx_stock_ranking', JSON.stringify(ranks));
                renderRankingUI(ranks);
            }
        } catch (e) {
            if (!rankingList.children.length) {
                rankingList.innerHTML = '<div class="empty-state">랭킹 로드 실패</div>';
            }
        }
    }

    function renderRankingUI(ranks) {
        if (!ranks || ranks.length === 0) {
            rankingList.innerHTML = '<div class="empty-state">아직 등록된 랭커가 없습니다.</div>';
            return;
        }
        const medals = ['gold', 'silver', 'bronze'];
        rankingList.innerHTML = ranks.map((r, i) => `
            <div class="rank-row">
                <div class="rank-num ${medals[i] || ''}">${i + 1}</div>
                <div class="rank-info">
                    <div class="rank-nick">${r.nick}</div>
                </div>
                <div class="rank-val">₩ ${Number(r.balance).toLocaleString()}</div>
            </div>
        `).join('');
    }

    init();
})();
