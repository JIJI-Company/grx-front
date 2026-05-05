document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('collectionGrid');
    const fusionBar = document.getElementById('fusionBar');
    const btnFusion = document.getElementById('btnFusion');
    const btnDelete = document.getElementById('btnDelete');
    const slot1 = document.getElementById('slot1');
    const slot2 = document.getElementById('slot2');
    const targetInfo = document.getElementById('fusionTargetInfo');
    
    const btnSortStar = document.getElementById('btnSortStar');
    const memberFilter = document.getElementById('memberFilter');

    // ── 인벤토리 로드 및 기간 만료 체크 ──
    const loadInventory = () => {
        const rawData = localStorage.getItem('grx_inventory_v2');
        if (!rawData) return [];

        try {
            const data = JSON.parse(rawData);
            const expireHours = (typeof CONFIG !== 'undefined' && CONFIG.GACHA) ? CONFIG.GACHA.EXPIRE_HOURS : 24;
            const expireMs = expireHours * 60 * 60 * 1000;

            if (Date.now() - data.lastUpdated > expireMs) {
                console.log("보관함 기간이 만료되어 초기화되었습니다.");
                localStorage.removeItem('grx_inventory_v2');
                return [];
            }
            // 접속할 때마다 시간을 갱신해주고 싶다면 아래 주석 해제
            // data.lastUpdated = Date.now();
            // localStorage.setItem('grx_inventory_v2', JSON.stringify(data));
            
            return data.items || [];
        } catch (e) {
            return [];
        }
    };

    let inventory = loadInventory();
    let selectedCards = [];
    let currentFilterMember = '';

    const updateMemberFilterOptions = () => {
        if (!memberFilter) return;
        const uniqueMembers = [...new Set(inventory.map(item => item.name))].sort();
        const currentVal = memberFilter.value;
        memberFilter.innerHTML = '<option value="">👤 멤버별 보기</option>';
        uniqueMembers.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.innerText = name;
            if (name === currentVal) opt.selected = true;
            memberFilter.appendChild(opt);
        });
    };
    updateMemberFilterOptions();

    if (btnSortStar) {
        btnSortStar.onclick = () => {
            currentFilterMember = '';
            if(memberFilter) memberFilter.value = '';
            btnSortStar.style.background = 'rgba(255, 26, 74, 0.2)';
            btnSortStar.style.borderColor = '#ff1a4a';
            btnSortStar.style.color = '#fff';
            renderCollection();
        };
    }

    if (memberFilter) {
        memberFilter.onchange = (e) => {
            currentFilterMember = e.target.value;
            if (currentFilterMember) {
                btnSortStar.style.background = 'transparent';
                btnSortStar.style.borderColor = '#333';
                btnSortStar.style.color = '#777';
            } else {
                btnSortStar.style.background = 'rgba(255, 26, 74, 0.2)';
                btnSortStar.style.borderColor = '#ff1a4a';
                btnSortStar.style.color = '#fff';
            }
            renderCollection();
        };
    }

    // ── 카드 렌더링 ──
    let renderCollection = () => {
        grid.innerHTML = '';
        if (inventory.length === 0) {
            grid.innerHTML = '<div class="empty-msg">아직 소환된 혈귀가 없습니다. 가챠에서 카드를 뽑아보세요!</div>';
            return;
        }

        let displayList = [...inventory];
        
        if (currentFilterMember) {
            displayList = displayList.filter(c => c.name === currentFilterMember);
        }

        // 항상 성급 높은 순, 이름 순 정렬
        displayList.sort((a, b) => {
            const rankDiff = (b.starRank || 1) - (a.starRank || 1);
            if (rankDiff !== 0) return rankDiff;
            return (a.name || '').localeCompare(b.name || '');
        });

        displayList.forEach(card => {
            const rank = card.starRank || 1;
            const cardEl = document.createElement('div');
            cardEl.className = `inventory-card star-${rank}`;
            if (selectedCards.find(s => s.id === card.id)) cardEl.classList.add('selected');

            // 별 아이콘 생성
            let starsHtml = '';
            for(let i=0; i<rank; i++) starsHtml += '<span class="star-icon">★</span>';

            cardEl.innerHTML = `
                <div class="star-container">${starsHtml}</div>
                <img src="${card.img}" alt="${card.name}">
                <div class="inventory-info">
                    <div class="inventory-rank">${card.rank}</div>
                    <div class="inventory-name">${card.name}</div>
                </div>
            `;

            cardEl.onclick = () => toggleSelect(card);
            grid.appendChild(cardEl);
        });
    };

    // ── 선택 로직 ──
    const toggleSelect = (card) => {
        const idx = selectedCards.findIndex(s => s.id === card.id);
        if (idx > -1) {
            selectedCards.splice(idx, 1);
        } else {
            selectedCards.push(card);
        }

        updateFusionUI();
        renderCollection();
    };

    const updateFusionUI = () => {
        if (selectedCards.length > 0) {
            fusionBar.classList.add('active');
            slot1.innerText = selectedCards[0] ? '✓' : '+';
            slot1.classList.toggle('filled', !!selectedCards[0]);
            
            slot2.innerText = selectedCards[1] && selectedCards.length === 2 ? '✓' : (selectedCards.length > 2 ? '...' : '+');
            slot2.classList.toggle('filled', selectedCards.length >= 2);

            if (btnDelete) {
                btnDelete.disabled = false;
                btnDelete.innerText = `선택 삭제 (${selectedCards.length})`;
            }

            if (selectedCards.length === 2) {
                const [c1, c2] = selectedCards;
                if (c1.starRank >= 5 || c2.starRank >= 5) {
                    targetInfo.innerText = '전설 카드는 합성이 불가합니다. (삭제는 가능)';
                    targetInfo.style.color = '#555';
                    btnFusion.disabled = true;
                } else if (c1.baseId === c2.baseId && (c1.starRank || 1) === (c2.starRank || 1)) {
                    const nextStar = (c1.starRank || 1) + 1;
                    const probs = {2: 100, 3: 80, 4: 60, 5: 50, 6: 40};
                    const prob = probs[nextStar] || 100;
                    targetInfo.innerHTML = `결과 예정: ${nextStar}성 [${c1.name}] <span style="color:#ffd700; margin-left:10px;">(성공 확률: ${prob}%)</span>`;
                    targetInfo.style.color = '#ff1a4a';
                    btnFusion.disabled = false;
                } else {
                    targetInfo.innerText = '동일 멤버 & 동일 성급 카드만 합성 가능합니다.';
                    targetInfo.style.color = '#555';
                    btnFusion.disabled = true;
                }
            } else if (selectedCards.length > 2) {
                targetInfo.innerText = `현재 ${selectedCards.length}장 선택됨 (삭제만 가능)`;
                targetInfo.style.color = '#aaa';
                btnFusion.disabled = true;
            } else {
                if (selectedCards[0] && selectedCards[0].starRank >= 5) {
                    targetInfo.innerText = '전설 카드는 삭제만 가능합니다.';
                } else {
                    targetInfo.innerText = '합성하려면 1장 더 선택하세요.';
                }
                targetInfo.style.color = '#aaa';
                btnFusion.disabled = true;
            }
        } else {
            fusionBar.classList.remove('active');
            btnFusion.disabled = true;
            if (btnDelete) btnDelete.disabled = true;
        }
    };

    if (btnDelete) {
        btnDelete.onclick = () => {
            if (selectedCards.length === 0) return;
            if (!confirm(`선택한 ${selectedCards.length}장의 카드를 정말 삭제하시겠습니까?`)) return;

            const selectedIds = selectedCards.map(c => c.id);
            inventory = inventory.filter(item => !selectedIds.includes(item.id));
            localStorage.setItem('grx_inventory', JSON.stringify(inventory));
            
            selectedCards = [];
            updateFusionUI();
            updateMemberFilterOptions();
            renderCollection();
        };
    }

    // ── 합성 수행 ──
    const performFusion = () => {
        if (selectedCards.length !== 2) return;

        const [c1, c2] = selectedCards;
        const nextStar = (c1.starRank || 1) + 1;
        const probs = {2: 100, 3: 80, 4: 60, 5: 50, 6: 40};
        const prob = probs[nextStar] || 100;
        
        // 1. 인벤토리에서 제거
        inventory = inventory.filter(item => item.id !== c1.id && item.id !== c2.id);

        const isSuccess = Math.random() * 100 <= prob;

        if (isSuccess) {
            // 2. 신규 승급 카드 생성
            const upgradedCard = {
                ...c1,
                id: Date.now(),
                starRank: nextStar,
                fortune: `✨ [${nextStar}성 효과] ` + c1.fortune
            };
            inventory.push(upgradedCard);
            localStorage.setItem('grx_inventory', JSON.stringify(inventory));

            // 3. UI 업데이트 및 연출
            createFusionExplosion(nextStar);
            selectedCards = [];
            updateFusionUI();
            updateMemberFilterOptions();
            renderCollection();
            
            if (nextStar === 5) {
                alert(`대성공! 전설의 5성 [${c1.name}] 카드를 획득하셨습니다!`);
            } else {
                alert(`강화 성공! ${c1.name} 카드가 ${nextStar}성으로 승급되었습니다!`);
            }
        } else {
            // 실패 시 본체(c1)만 남기고 c2는 파괴
            inventory.push(c1);
            localStorage.setItem('grx_inventory', JSON.stringify(inventory));
            
            // 흔들림 연출 (실패)
            document.body.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => document.body.style.animation = '', 500);

            selectedCards = [];
            updateFusionUI();
            updateMemberFilterOptions();
            renderCollection();

            alert(`강화에 실패했습니다... 재료 카드가 소멸되었습니다.`);
        }
    };

    btnFusion.onclick = performFusion;

    const createFusionExplosion = (nextStar) => {
        // 화면 흔들림 효과
        document.body.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => document.body.style.animation = '', 500);

        // 강렬한 플래시 효과
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0'; flash.style.left = '0';
        flash.style.width = '100vw'; flash.style.height = '100vh';
        flash.style.backgroundColor = nextStar === 5 ? '#fff' : 'rgba(255, 26, 74, 0.9)';
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 1s ease-out';
        document.body.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = '0';
        });

        setTimeout(() => flash.remove(), 1000);

        // 파티클
        for(let i=0; i<50; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.style.left = '50%';
            spark.style.top = '50%';
            spark.style.setProperty('--dx', `${(Math.random()-0.5)*800}px`);
            spark.style.setProperty('--dy', `${(Math.random()-0.5)*800-400}px`);
            spark.style.background = nextStar === 5 ? '#ffd700' : '#ff1a4a';
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 1000);
        }
    };

    // 홀로그램 3D 틸트 효과 (마우스 무브 모션)
    const initTilt = (cardEl, isLegendary) => {
        cardEl.addEventListener('mousemove', (e) => {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            
            if (isLegendary) {
                // 빛 반사 (글레어) 효과 위치 갱신
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                cardEl.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4) 0%, transparent 50%), linear-gradient(45deg, #ff1a4a, #ffd700, #00d4ff, #ff1a4a)`;
                cardEl.style.backgroundSize = '100% 100%, 300% 300%';
            }

            cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        cardEl.addEventListener('mouseleave', () => {
            cardEl.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            if (isLegendary) {
                cardEl.style.background = `linear-gradient(45deg, #ff1a4a, #ffd700, #00d4ff, #ff1a4a)`;
                cardEl.style.backgroundSize = '300% 300%';
            }
        });
    };

    const _renderCollectionProxy = renderCollection;
    renderCollection = () => {
        _renderCollectionProxy();
        // 렌더링된 요소들에 틸트 트랜지션 추가
        grid.querySelectorAll('.inventory-card').forEach(cardEl => {
            cardEl.style.transition = 'transform 0.1s ease-out';
            const isLegendary = cardEl.classList.contains('star-5');
            initTilt(cardEl, isLegendary);
        });
    };

    renderCollection();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
`;
document.head.appendChild(style);
