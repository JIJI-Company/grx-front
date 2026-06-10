const DataService = {
  async getData(type, onUpdate = null) {
    this.checkVersion();

    const ttl = CONFIG.TTLS[type] || 0;
    const cachedObj = this.getCacheWithMeta(type);
    
    if (ttl === 0) {
      return await this.fetchFromServer(type);
    }

    if (cachedObj) {
      const { data, isExpired } = cachedObj;
      
      if (isExpired) {
        this.fetchFromServer(type).then(newData => {
          if (onUpdate && newData) onUpdate(newData);
        });
      }
      return data;
    }

    return await this.fetchFromServer(type);
  },

  checkVersion() {
    const storedVer = localStorage.getItem('grx_cache_version');
    const currentVer = String(CONFIG.CACHE_VERSION || 1);

    if (storedVer !== currentVer) {
      console.warn(`[DataService] New version detected (${storedVer} -> ${currentVer}). Clearing all caches...`);
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('grx_cache_')) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('grx_cache_version', currentVer);
    }
  },

  async fetchFromServer(type) {
    if (type === 'notion_calendar') {
      const proxyUrl = CONFIG.NOTION_CALENDAR_PROXY || "/.netlify/functions/notion-calendar";
      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy Error: ${response.status}`);
        
        const data = await response.json();
        if (data && (CONFIG.TTLS[type] > 0)) {
          this.setCache(type, data);
        }
        
        return data;
      } catch (err) {
        console.error(`[DataService] notion_calendar 로드 실패:`, err.message);
        return [];
      }
    }

    const sheetNameMap = { 
      'live': 'Live', 
      'history': 'History', 
      'times': 'Times', 
      'posts': 'Posts',
      'schedule': 'Schedule',
      'Gallery': 'Gallery'
    };
    const sheetName = sheetNameMap[type] || type;

    // 🏛️ 모든 요청을 우선 GAS Proxy로 통합하여 안정성 확보
    const proxyUrl = `${CONFIG.GAS_PROXY}?sheet=${sheetName}${type === 'Gallery' ? '&type=gallery' : ''}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy Error: ${response.status}`);
      
      const data = await response.json();
      const targetData = data[sheetName] || data[type] || data;

      if (targetData && (CONFIG.TTLS[type] > 0)) {
        this.setCache(type, targetData);
      }
      
      return targetData;
    } catch (err) {
      console.error(`[DataService] ${type} 로드 실패:`, err.message);
      return []; 
    }
  },

  setCache(key, data) {
    const expiry = Date.now() + (CONFIG.TTLS[key] || 3600) * 1000;
    const cacheObj = { data, expiry };
    localStorage.setItem(`grx_cache_${key}`, JSON.stringify(cacheObj));
  },

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

  async getLive()      { return await this.getData('live'); },
  async getHistory()   { return await this.getData('history'); },
  async getTimes()     { return await this.getData('times'); },
  async getPosts()     { return await this.getData('posts'); },
  async getSchedules() { return await this.getData('schedule'); },
  async getNotionSchedules(onUpdate = null) { return await this.getData('notion_calendar', onUpdate); }
};
