/**
 * GRX Unity Data Service (v4.0)
 * 모든 데이터 요청, 캐싱, 전역 버전 관리를 통합 수행합니다.
 */
const DataService = {
  /** 
   * 데이터 조회 (설정된 TTL에 따라 실시간 또는 캐시 작동)
   */
  async getData(type, onUpdate = null) {
    this.checkVersion(); // ✅ 데이터 조회 전 전역 버전 체크 (캐시 강제 초기화용)

    const ttl = CONFIG.TTLS[type] || 0;
    const cachedObj = this.getCacheWithMeta(type);
    
    // ✅ 1. 실시간 모드 (TTL이 0일 때)
    if (ttl === 0) {
      return await this.fetchFromServer(type);
    }

    // ✅ 2. 캐시 모드 (TTL이 0보다 클 때)
    if (cachedObj) {
      const { data, isExpired } = cachedObj;
      
      // 만약 만료되었다면 배경에서 업데이트 시도 (SWR)
      if (isExpired) {
        this.fetchFromServer(type).then(newData => {
          if (onUpdate && newData) onUpdate(newData);
        });
      }
      return data;
    }

    // ✅ 3. 캐시가 아예 없을 때 (최초 로드)
    return await this.fetchFromServer(type);
  },

  /** 🔄 글로벌 캐시 버전 체크 (전 세계 사용자 동시 업데이트용) */
  checkVersion() {
    const storedVer = localStorage.getItem('grx_cache_version');
    const currentVer = String(CONFIG.CACHE_VERSION || 1);

    if (storedVer !== currentVer) {
      console.warn(`[DataService] New version detected (${storedVer} -> ${currentVer}). Clearing all caches...`);
      
      // ✅ 우리가 만든 grx_cache_ 아이템만 골라 삭제
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('grx_cache_')) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('grx_cache_version', currentVer);
    }
  },

  /** GAS에서 데이터 가져오기 (타임아웃 8초 포함) */
  async fetchFromServer(type) {
    const sheetNameMap = { 
      'live': 'Live', 
      'history': 'History', 
      'times': 'Times', 
      'posts': 'Posts',
      'schedule': 'Schedule',
      'Gallery': 'Gallery'
    };
    const sheetName = sheetNameMap[type] || type;

    // 🏛️ [V7.0] 다중 시트 관리 대응: 갤러리는 전용 URL 사용
    let baseUrl = CONFIG.GAS_URL;
    if (sheetName === 'Gallery' && CONFIG.GALLERY_GAS_URL) {
      baseUrl = CONFIG.GALLERY_GAS_URL;
    }

    if (!baseUrl) {
      console.warn("GAS URL 설정 필요 (config.js)");
      return null;
    }

    try {
      const controller = new AbortController();
      // [수정] 16명 전원의 라이브 체크 로직이 10초 이상 걸리므로, 대기 시간을 20초로 늘립니다.
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      // 🔗 Token을 URL 끝에 붙여서 보안 강화
      const url = `${baseUrl}?sheet=${sheetName}&token=${CONFIG.API_TOKEN || ''}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const targetData = data[sheetName] || data[type] || null;

      // 결과 캐시 저장 (TTL이 있을 때만)
      if (targetData && (CONFIG.TTLS[type] > 0)) {
        this.setCache(type, targetData);
      }
      
      return targetData;
    } catch (err) {
      // ⚠️ 배포 환경에서는 상세 에러 대신 간략한 경고만 남깁니다.
      if (err.name === 'AbortError') console.warn("[DataService] 요청 타임아웃.");
      else console.error(`[DataService] ${type} 로드 실패:`, err.message);
      return []; // ✅ null 대신 빈 배열을 반환하여 UI 루프 에러 방지
    }
  },

  /** 로컬 스토리지 캐시 저장 */
  setCache(key, data) {
    const expiry = Date.now() + (CONFIG.TTLS[key] || 3600) * 1000;
    const cacheObj = { data, expiry };
    localStorage.setItem(`grx_cache_${key}`, JSON.stringify(cacheObj));
  },

  /** 로컬 스토리지 캐시 읽기 (만료 정보 포함) */
  getCacheWithMeta(key) {
    const itemStr = localStorage.getItem(`grx_cache_${key}`);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = Date.now();
      const isExpired = now > item.expiry;
      return { data: item.data, isExpired };
    } catch (e) {
      return null;
    }
  },

  // 편의 함수들 (하위 호환성 유지)
  async getLive()      { return await this.getData('live'); },
  async getHistory()   { return await this.getData('history'); },
  async getTimes()     { return await this.getData('times'); },
  async getPosts()     { return await this.getData('posts'); },
  async getSchedules() { return await this.getData('schedule'); }
};
