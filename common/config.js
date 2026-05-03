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

  CACHE_VERSION: 8,

  EVENT_POPUP: {
    enable: true,
    title: "🎉 WELCOME 임민트 🎉",
    message: "민트를 환영해주세요!<br>",
    imageUrl: "img/mint2.png",
    link: ""
  },

  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true
  }
};
