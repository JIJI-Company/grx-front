const CONFIG = {
  GAS_PROXY: "/.netlify/functions/gas-proxy",
  API_TOKEN: "SERVER_MANAGED", 
  
  TTLS: {
    live: 600,
    history: 3600,
    times: 3600,
    posts: 3600,
    schedule: 60
  },

  CACHE_VERSION: 7,

  EVENT_POPUP: {
    enable: true,
    title: "🎉 딴딴2당의 천옵대 우승을 축하합니다!! 🎉",
    message: "딴딴2당의 우승을 축하해주세요<br>",
    imageUrl: "img/windan.jpeg",
    link: ""
  },

  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true
  }
};
