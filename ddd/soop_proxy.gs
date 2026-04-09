/**
 * G-CASTLE SOOP(AfreecaTV) Board Proxy
 * 
 * 1. 구글 시트(혹은 script.google.com)에서 새 프로젝트 생성
 * 2. 아래 코드를 전체 붙여넣기
 * 3. [배포] -> [새 배포] -> [유형: 웹 앱]
 * 4. [설정] -> [나(본인 계정)] 및 [액세스 권한: 모든 사용자(Anyone)] 선택
 * 5. 배포 후 나오는 [웹 앱 URL]을 복사하여 schedule.html의 GAS_URL 항목에 넣으세요.
 */

function doGet(e) {
  const bjId = "aksen7833";
  const boardId = "55613873"; // 게시판 번호
  const apiUrl = `https://bjapi.sooplive.co.kr/api/${bjId}/board/articles?board_id=${boardId}&page_no=1`;

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      }
    });
    
    const jsonString = response.getContentText();
    return ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
