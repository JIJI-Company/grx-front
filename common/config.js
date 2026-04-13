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
    title: "🎉 Welcome 서라0 🎉",
    message: "아꾸츠키 서라0 환영해주세요<br> 멋진 행보를 계속해서 지켜봐주세요.",
    imageUrl: "img/서라0.jpg",
    link: ""
  },

  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true
  }
};
