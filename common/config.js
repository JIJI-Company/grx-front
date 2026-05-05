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
    title: "🎉 WELCOME 냥쏘,윤타미,김옥독🎉",
    message: "새로운 혈귀들을 환영해주세요!<br>",
    imageUrl: "img/welcom.png",
    link: ""
  },

  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true
  },

  GACHA: {
    EXPIRE_HOURS: 48 // 24시간 동안 미접속 시 보관함 초기화
  }
};
