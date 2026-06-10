const CONFIG = {
  GAS_PROXY: "/.netlify/functions/gas-proxy",
  STOCK_PROXY: "/.netlify/functions/stock-proxy",
  NOTION_CALENDAR_PROXY: "/.netlify/functions/notion-calendar",
  API_TOKEN: "SERVER_MANAGED", 
  
  TTLS: {
    live: 600,
    history: 3600,
    times: 3600,
    posts: 3600,
    schedule: 60,
    notion_calendar: 10
  },

  CACHE_VERSION: 9,

  EVENT_POPUP: {
    enable: true,
    title: "🎉 GOODBYE🎉",
    message: " 또다른 도전을 응원해주세여!<br>",
    imageUrl: "img/goodbye.png",
    link: ""
  },

  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true
  },

  GACHA: {
    EXPIRE_HOURS: 999999 // 사실상 무제한으로 변경하여 초기화 방지
  }
};
