/**
 * v3.1 아키텍처 - 중앙 설정 파일입니다.
 * GAS 배포 후 받으신 URL을 GAS_URL에 넣으시면 됩니다!
 */
const CONFIG = {
  // 🔗 [필독] 구글 시트 배포 후 받으신 웹 앱 URL을 여기에 붙여넣으세요!
  GAS_URL: "https://script.google.com/macros/s/AKfycbwHRxKUFPpgkycGTj1vuteTmLl3U-1cRZTjpp7x-XBXz0h_rHR_OLDqF-iKEVdj0QX-/exec", 
  GALLERY_GAS_URL: "https://script.google.com/macros/s/AKfycbybmF9BIsWWE_3CV_Lgnyu05fKniJKHzwCDV0hTeREDHtWY-rdfDU_NxPhuptVM8SCk3Q/exec",
  API_TOKEN: "ggu_castle_secure_99", // 🔑 구글 앱스 스크립트 보안용 암호 (임의로 설정)
  
  // ⏱️ 데이터별 캐시 유지 시간 (0이면 매번 새로고침)
  TTLS: {
    live: 600,         // 방송 상태: 10분 유지 (시트 업데이트 주기와 동기화)
    history: 3600,     // 수상 기록: 1시간 유지
    times: 3600,       // 뉴스/공지: 1시간 유지
    posts: 3600,       // 게시글: 1시간 유지
    schedule: 60       // 일정표: 수집 주기(테스트용)로 맞춤 (1분 뒤면 새로 반영)
  },

  // 🔄 캐시 버전 (시트를 대거 수정하고 모두에게 즉시 보이게 하려면 이 숫자를 올리세요!)
  CACHE_VERSION: 6,

  // 🎇 대형 이벤트 / 축하 팝업 설정
  // 큰 행사가 있을 때 enable을 true로 변경하면 첫 접속 시 자동으로 화려한 팝업이 뜹니다.
  EVENT_POPUP: {
    enable: true, // 팝업 띄우기 온/오프 (true / false)
    title: "🎉 Welcome 서라0 🎉", // 팝업 제목
    message: "아꾸츠키 서라0 환영해주세요<br> 멋진 행보를 계속해서 지켜봐주세요.", // 팝업 메시지 (html 태그 사용 가능)
    imageUrl: "img/서라0.jpg", // 팝업 상단 이미지 (안 쓸거면 "" 로 비워두시면 됩니다)
    link: "" // "자세히 보기" 버튼 클릭 시 이동할 링크 (안 쓸거면 "" 로 비워두세요)
  },

  // 📡 SOOP (아프리카TV) OpenAPI 설정
  // 🔒 보안을 위해 키 정보는 Netlify 환경 변수로 이동되었습니다.
  SOOP: {
    PROXY_URL: "/.netlify/functions/soop-proxy",
    ENABLED: true // true면 Proxy를 통해 SOOP API를 활용합니다.
  }
};
