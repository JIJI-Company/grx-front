document.addEventListener('DOMContentLoaded', () => {
    // ── DOM 요소 참조 ──
    const grid = document.getElementById('collectionGrid');
    const fusionBar = document.getElementById('fusionBar');
    const btnFusion = document.getElementById('btnFusion');
    const btnDeselect = document.getElementById('btnDeselect');
    const slot1 = document.getElementById('slot1');
    const slot2 = document.getElementById('slot2');
    const targetInfo = document.getElementById('fusionTargetInfo');
    const btnSortStar = document.getElementById('btnSortStar');
    const memberFilter = document.getElementById('memberFilter');
    const btnBulkFusion = document.getElementById('btnBulkFusion');
    const bulkFusionTarget = document.getElementById('bulkFusionTarget');

    // ── 상태 변수 ──
    let inventory = [];
    let selectedCards = [];
    let currentFilterMember = '';

    // ── 데이터 로드 ──
    const loadInventory = () => {
        const rawData = localStorage.getItem('grx_inventory_v2');
        if (!rawData) return [];
        try {
            const data = JSON.parse(rawData);
            const expireHours = 24; 
            const expireMs = expireHours * 60 * 60 * 1000;
            if (Date.now() - (data.lastUpdated || 0) > expireMs) {
                localStorage.removeItem('grx_inventory_v2');
                return [];
            }
            return data.items || [];
        } catch (e) { return []; }
    };

    // ── 필터 옵션 갱신 ──
    const updateFilterOptions = () => {
        if (!memberFilter) return;
        const names = [...new Set(inventory.map(item => item.name))].sort();
        const savedValue = memberFilter.value;
        memberFilter.innerHTML = '<option value="">👤 멤버별 보기</option>';
        names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            if (name === savedValue) opt.selected = true;
            memberFilter.appendChild(opt);
        });
    };

    // ── 렌더링 함수 ──
    const renderCollection = () => {
        if (!grid) return;
        grid.innerHTML = '';
        let list = [...inventory];
        if (currentFilterMember) list = list.filter(c => c.name === currentFilterMember);
        list.sort((a, b) => (b.starRank - a.starRank) || a.name.localeCompare(b.name));

        if (list.length === 0) {
            grid.innerHTML = '<div class="empty-msg">조건에 맞는 카드가 없습니다.</div>';
            return;
        }

        list.forEach(card => {
            const rank = card.starRank || 1;
            const cardEl = document.createElement('div');
            cardEl.className = `inventory-card star-${rank}`;
            if (selectedCards.some(s => s.id === card.id)) cardEl.classList.add('selected');

            // 별 렌더링: 6성은 빨간색 별 1개, 나머지는 기존 방식
            let stars = '';
            if (rank === 6) {
                stars = '<span class="star-icon" style="color:#ff1a4a; font-size:1.2rem; text-shadow: 0 0 10px #ff1a4a;">★</span>';
            } else {
                for(let i=0; i<rank; i++) stars += '<span class="star-icon">★</span>';
            }

            cardEl.innerHTML = `
                <div class="star-container">${stars}</div>
                <img src="${card.img}" alt="${card.name}">
                <div class="inventory-info">
                    <div class="inventory-rank">${card.rank || ''}</div>
                    <div class="inventory-name">${card.name}</div>
                </div>
            `;
            cardEl.onclick = () => toggleSelect(card);
            grid.appendChild(cardEl);
        });
        applyTiltEffects();
    };

    // ── 선택 토글 ──
    const toggleSelect = (card) => {
        const idx = selectedCards.findIndex(s => s.id === card.id);
        if (idx > -1) selectedCards.splice(idx, 1); else selectedCards.push(card);
        updateFusionUI(); renderCollection();
    };

    // ── 합성 UI 업데이트 ──
    const updateFusionUI = () => {
        if (selectedCards.length > 0) {
            fusionBar.classList.add('active');
            slot1.textContent = selectedCards[0] ? '✓' : '+';
            slot1.classList.toggle('filled', !!selectedCards[0]);
            slot2.textContent = selectedCards[1] ? '✓' : (selectedCards.length > 1 ? '...' : '+');
            slot2.classList.toggle('filled', selectedCards.length >= 2);
            if (btnDeselect) {
                btnDeselect.disabled = false;
                btnDeselect.textContent = `선택 취소 (${selectedCards.length})`;
            }
            if (selectedCards.length === 2) {
                const [c1, c2] = selectedCards;
                if (c1.starRank >= 6 || c2.starRank >= 6) {
                    targetInfo.textContent = '신화(6성) 등급은 더 이상 합성이 불가합니다.';
                    btnFusion.disabled = true;
                } else if (c1.baseId === c2.baseId && c1.starRank === c2.starRank) {
                    const nextStar = c1.starRank + 1;
                    const probs = {2: 95, 3: 65, 4: 45, 5: 30, 6: 20};
                    const prob = probs[nextStar] || 100;
                    targetInfo.innerHTML = `결과 예정: ${nextStar}성 [${c1.name}] <span style="color:#ffd700; margin-left:10px;">(성공 확률: ${prob}%)</span>`;
                    btnFusion.disabled = false;
                } else {
                    targetInfo.textContent = '동일 멤버 & 동일 성급 카드만 합성 가능합니다.';
                    btnFusion.disabled = true;
                }
            } else { targetInfo.textContent = '합성하려면 동일한 카드 1장을 더 선택하세요.'; btnFusion.disabled = true; }
        } else {
            fusionBar.classList.remove('active');
            if (btnDeselect) { btnDeselect.disabled = true; btnDeselect.textContent = '선택 취소'; }
            btnFusion.disabled = true;
        }
    };

    if (btnDeselect) {
        btnDeselect.addEventListener('click', () => {
            selectedCards = []; updateFusionUI(); renderCollection();
        });
    }

    if (memberFilter) {
        memberFilter.addEventListener('change', (e) => {
            currentFilterMember = e.target.value; renderCollection();
        });
    }

    if (btnSortStar) {
        btnSortStar.addEventListener('click', () => {
            currentFilterMember = ''; if (memberFilter) memberFilter.value = ''; renderCollection();
        });
    }

    if (btnFusion) {
        btnFusion.addEventListener('click', () => {
            if (selectedCards.length !== 2) return;
            const [c1, c2] = selectedCards;
            const nextStar = c1.starRank + 1;
            const probs = {2: 95, 3: 65, 4: 45, 5: 30, 6: 20};
            const prob = probs[nextStar] || 100;
            inventory = inventory.filter(item => item.id !== c1.id && item.id !== c2.id);
            if (Math.random() * 100 <= prob) {
                const upgraded = { ...c1, id: Date.now(), starRank: nextStar, fortune: `✨ [${nextStar}성 효과] ` + c1.fortune };
                inventory.push(upgraded); createFusionExplosion(nextStar); selectedCards = [];
                const msg = nextStar === 6 ? `🎊 전설을 초월했습니다! 6성 [${c1.name}] MYTHIC 획득!!!` : (nextStar === 5 ? `대성공! 5성 [${c1.name}] 획득!` : `${c1.name} ${nextStar}성 승급 성공!`);
                setTimeout(() => alert(msg), 600);
            } else {
                inventory.push(c1); document.body.style.animation = 'shake 0.5s ease-in-out'; setTimeout(() => document.body.style.animation = '', 500);
                selectedCards = []; setTimeout(() => alert('강화 실패... 재료 카드가 파괴되었습니다.'), 600);
            }
            saveAndSync();
        });
    }

    if (btnBulkFusion) {
        btnBulkFusion.addEventListener('click', () => {
            const targetStar = bulkFusionTarget.value; // 'all' or '1'~'5'
            const groups = {};
            inventory.forEach(card => {
                if (card.starRank >= 6) return;
                // 성급 필터링 적용
                if (targetStar !== 'all' && card.starRank != targetStar) return;

                const key = `${card.baseId}_${card.starRank}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(card);
            });

            let successCount = 0; let failCount = 0;
            const newInventory = [];
            const processedIds = new Set();
            const probs = {2: 95, 3: 65, 4: 45, 5: 30, 6: 20};

            Object.keys(groups).forEach(key => {
                const group = groups[key];
                const pairCount = Math.floor(group.length / 2);
                const nextStar = group[0].starRank + 1;
                const prob = probs[nextStar] || 100;

                for (let i = 0; i < pairCount; i++) {
                    const c1 = group[i * 2]; const c2 = group[i * 2 + 1];
                    processedIds.add(c1.id); processedIds.add(c2.id);
                    if (Math.random() * 100 <= prob) {
                        const upgraded = { ...c1, id: Date.now() + Math.random(), starRank: nextStar, fortune: `✨ [${nextStar}성 효과] ` + c1.fortune };
                        newInventory.push(upgraded); successCount++;
                    } else {
                        newInventory.push({ ...c1, id: Date.now() + Math.random() }); failCount++;
                    }
                }
            });

            if (successCount + failCount === 0) { alert('일괄 합성할 수 있는 카드 쌍이 없습니다.'); return; }
            if (!confirm(`총 ${successCount + failCount}번의 합성을 진행하시겠습니까?\n(성공 확률은 각 등급별 확률과 동일하게 적용됩니다.)`)) return;

            inventory = [...inventory.filter(item => !processedIds.has(item.id)), ...newInventory];
            selectedCards = [];
            createFusionExplosion(5);
            saveAndSync();
            setTimeout(() => alert(`일괄 합성 완료!\n성공: ${successCount}회\n실패: ${failCount}회`), 600);
        });
    }

    const saveAndSync = () => {
        localStorage.setItem('grx_inventory_v2', JSON.stringify({ items: inventory, lastUpdated: Date.now() }));
        updateFilterOptions(); updateFusionUI(); renderCollection();
    };

    const createFusionExplosion = (nextStar) => {
        document.body.style.animation = 'shake 0.5s ease-in-out'; setTimeout(() => document.body.style.animation = '', 500);
        const flash = document.createElement('div');
        flash.style.cssText = `position:fixed; inset:0; z-index:9999; transition:opacity 1s ease-out; background-color: ${nextStar === 6 ? '#8e2de2' : (nextStar === 5 ? '#fff' : 'rgba(255, 26, 74, 0.9)')};`;
        document.body.appendChild(flash); requestAnimationFrame(() => flash.style.opacity = '0'); setTimeout(() => flash.remove(), 1000);
    };

    const initTilt = (cardEl, isLegendary, isMythic) => {
        cardEl.addEventListener('mousemove', (e) => {
            const rect = cardEl.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            const rotateX = ((y - (rect.height / 2)) / (rect.height / 2)) * -15; const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 15;
            if (isLegendary || isMythic) {
                const gx = (x / rect.width) * 100; const gy = (y / rect.height) * 100;
                const grad = isMythic ? `linear-gradient(45deg, #4a00e0, #8e2de2, #fff, #4a00e0)` : `linear-gradient(45deg, #ff1a4a, #ffd700, #00d4ff, #ff1a4a)`;
                cardEl.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.4) 0%, transparent 50%), ${grad}`;
                cardEl.style.backgroundSize = '100% 100%, 300% 300%';
            }
            cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        cardEl.addEventListener('mouseleave', () => {
            cardEl.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            if (isLegendary || isMythic) {
                cardEl.style.background = isMythic ? `linear-gradient(45deg, #4a00e0, #8e2de2, #fff, #4a00e0)` : `linear-gradient(45deg, #ff1a4a, #ffd700, #00d4ff, #ff1a4a)`;
                cardEl.style.backgroundSize = '300% 300%';
            }
        });
    };

    const applyTiltEffects = () => {
        grid.querySelectorAll('.inventory-card').forEach(el => {
            initTilt(el, el.classList.contains('star-5'), el.classList.contains('star-6'));
        });
    };

    inventory = loadInventory(); updateFilterOptions(); renderCollection();
});
