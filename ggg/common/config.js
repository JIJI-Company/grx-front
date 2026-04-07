/**
 * v3.1 아키텍처 - 중앙 설정 파일입니다.
 * GAS 배포 후 받으신 URL을 GAS_URL에 넣으시면 됩니다!
 */
const CONFIG = {
  // 🔗 [필독] 구글 시트 배포 후 받으신 웹 앱 URL을 여기에 붙여넣으세요!
  GAS_URL: "https://script.google.com/macros/s/AKfycbwtP_zvNVp3Z9LWICRRqgWzvR744RUwCfpKsF7NAxs1_wGO-rEfIvccp35S65bG6_qc/exec", 
  API_TOKEN: "ggu_castle_secure_99", // 🔑 구글 앱스 스크립트 보안용 암호 (임의로 설정)
  // ⏱️ 데이터별 캐시 유지 시간 (0이면 매번 새로고침)
  TTLS: {
    live: 300,         // 방송 상태: 5분 유지 (시트 업데이트 주기와 동기화)
    history: 3600,     // 수상 기록: 1시간 유지
    times: 3600,       // 뉴스/공지: 1시간 유지
    posts: 3600        // 게시글: 1시간 유지
  },

  // 🔄 캐시 버전 (시트를 대거 수정하고 모두에게 즉시 보이게 하려면 이 숫자를 올리세요!)
  CACHE_VERSION: 1,

  // 🎇 대형 이벤트 / 축하 팝업 설정
  // 큰 행사가 있을 때 enable을 true로 변경하면 첫 접속 시 자동으로 화려한 팝업이 뜹니다.
  EVENT_POPUP: {
    enable: true, // 팝업 띄우기 온/오프 (true / false)
    title: "🎉 GGU-CASTLE 대규모 축제 🎉", // 팝업 제목
    message: "무한성 크루 충동서버 준우승을 진심으로 축하합니다!<br>멤버들의 멋진 행보를 계속해서 지켜봐주세요.", // 팝업 메시지 (html 태그 사용 가능)
    imageUrl: "/grx/img/ggu_title.jpg", // 팝업 상단 이미지 (안 쓸거면 "" 로 비워두시면 됩니다)
    link: "" // "자세히 보기" 버튼 클릭 시 이동할 링크 (안 쓸거면 "" 로 비워두세요)
  }
};
